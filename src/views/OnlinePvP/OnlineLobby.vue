<template>
  <div class="lobby-container">
    <h1>Lobby</h1>
    <div class="users-container">
      <div v-if="users.length === 0">
        No users present
      </div>
      <table
        v-else
        class="users-table"
      >
        <thead>
          <tr>
            <th>Player</th>
            <th>Name</th>
            <th>Flag</th>
            <th>Rank</th>
            <th>Games Played</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(user, index) in users"
            :key="user.userID"
            :class="{ 'alt-row': index % 2 !== 0 }"
          >
            <td><img
                :src="`/avatars/Head${user.avatarId}.png`"
                alt="avatar"
                class="avatar-img"
              /></td>
            <td>{{ user.username }}</td>
            <td><img
                :src="`/flags/Flag${user.flagId}.png`"
                alt="flag"
                class="flag-img"
              /></td>
            <td>{{ user.rank }}</td>
            <td>{{ user.gamesPlayed }}</td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="users.length >= 2"
        class="start-game-container"
      >
        <div class="option-box">
          <div class="shortcut-key">S</div>
          <button @click="startGame">Start Game</button>
        </div>
      </div>
      <div
        v-if="users.length < 2"
        class="mt-5"
      >
        <p>Waiting for other player to start game...</p>
      </div>

    </div>
  </div>
</template>


<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from "vue";
import { supabase } from "../../supabase";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "vue-router";
import { useStore } from "../../stores/store";
import { MAX_PLAYERS, RANKS } from "../../components/GameConstants";

type PlayerActiveStatus = {
  [key: string]: boolean;
};

export default defineComponent({
  setup() {
    // initiate Pinia store
    const store = useStore();

    const userIDs = ref<string[]>([]);
    const myUserID = uuidv4(); // Create a unique ID for this user
    const users = ref<
      Array<{
        userID: string;
        username: string;
        avatarId: number;
        flagId: number;
        rank: number;
        gamesPlayed: number;
      }>
    >([]);

    const userStatus = ref({});

    const router = useRouter();
    let lobbyChannel: any;

    // fetch necessary data for waiting user table
    const fetchUserData = async () => {
      // Default values for guest users
      let userDetails = {
        username: "Guest-" + Math.floor(Math.random() * 100000).toString(),
        avatarId: 1, // Default avatar ID
        flagId: 1, // Default flag ID
        rank: "Guest", // Default rank
        gamesPlayed: localStorage.getItem("gamesPlayed"), // Games played count from local storage
      };

      // Fetch data for registered users
      if (store.userSession) {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "username, avatar_id, flag_id, last_unlocked_level, games_played"
          )
          .eq("id", store.userSession.user.id)
          .single();

        if (data) {
          const lastUnlockedLevel = data.last_unlocked_level || 0; // Default to 0 if not found
          const rank = RANKS[lastUnlockedLevel - 1] || "Landlubber"; // Match current rank from RANKS array in game constants

          userDetails = {
            // Fallback to default if not found
            username: data.username,
            avatarId: data.avatar_id || 1,
            flagId: data.flag_id || 1,
            rank,
            gamesPlayed: data.games_played || 0,
          };
        }
      }

      return userDetails;
    };

    const subscribeAndTrack = () => {
      lobbyChannel.subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to the channel.");

          // Set the playerID
          store.setPlayerID(myUserID);
        }
      });
    };

    const createNewGame = async (players: string[]) => {
      // Generate a random text_id based on the number of texts you have
      // Replace this with an actual query to your 'texts' table to get the count
      const textCount = 100; // This should be dynamically retrieved from your 'texts' table
      const randomTextId = Math.floor(Math.random() * textCount) + 1;

      // Set the start_time a few seconds from now
      const startTime = new Date();
      startTime.setSeconds(startTime.getSeconds() + 5); // 5 seconds from now

      const playerActiveStatus: PlayerActiveStatus = players.reduce(
        (status, playerID) => {
          status[playerID] = true;
          return status;
        },
        {} as PlayerActiveStatus
      );

      // Use .select() to get the newly inserted record
      const { data, error } = await supabase
        .from("games")
        .insert([
          {
            players,
            text_id: randomTextId,
            start_time: startTime,
            status: "waiting",
            player_active: playerActiveStatus,
          },
        ])
        .select("id"); // Fetching only the 'id' field for efficiency

      if (error) {
        console.error("Error creating new game:", error);
        return null;
      }

      if (data && data.length > 0 && data[0].id) {
        return {
          gameId: data[0].id, // Return the server-generated game ID
        };
      } else {
        console.error("Data is null or doesn't contain an id");
        return null;
      }
    };

    // *NOTE* what happens if two players hit the Start button practically at the same time, will logic break?
    const startGame = async () => {
      console.log("startGame called");
      console.log(
        `Users in lobby: ${users.value.map((u) => u.username).join(", ")}`
      );

      if (users.value.length >= 2) {
        // Extract just the userID from each user object to create an array of userIDs
        const playersToStart = users.value.map((u) => u.userID);

        // Fill the remaining slots with other players from the lobby, up to MAX_PLAYERS
        for (
          let i = 0;
          i < userIDs.value.length && playersToStart.length < MAX_PLAYERS;
          i++
        ) {
          if (userIDs.value[i] !== myUserID) {
            playersToStart.push(userIDs.value[i]);
          }
        }

        // Pass this 'playersToStart' array of userIDs to createNewGame
        const gameDetails = await createNewGame(playersToStart);
        if (!gameDetails || !gameDetails.gameId) {
          console.log("Failed to create new game.");
          return;
        }

        console.log(`Game ID: ${gameDetails.gameId}`);

        await lobbyChannel.send({
          type: "broadcast",
          event: "game_start",
          payload: {
            participants: playersToStart,
            game_id: gameDetails.gameId,
          },
        });
        console.log("Game start event sent");

        // Remove the players who were selected for the game from the lobby
        // Make sure to compare the userIDs as strings, not the entire user object
        users.value = users.value.filter(
          (user) => !playersToStart.includes(user.userID)
        );
      } else {
        console.log("Not enough users to start the game");
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key === "s") {
        startGame();
      }
    };

    onMounted(async () => {
      window.addEventListener("keydown", handleKeyPress);

      const userDetails = await fetchUserData();

      userStatus.value = {
        user: myUserID,
        online_at: new Date().toISOString(),
        ...userDetails, // Spread user details into the userStatus object
      };

      console.log("User Status:", userStatus.value);

      // Initialize the channel with 'presence' config
      lobbyChannel = supabase.channel("lobby", {
        config: {
          broadcast: { self: true }, // important: user can receive own messages
          presence: { key: myUserID }, // important: user tracks their own id
        },
      });

      // Presence sync event , avatarId, flagId, rank, gamesPlayed
      lobbyChannel
        .on("presence", { event: "sync" }, async () => {
          const presenceState = lobbyChannel.presenceState();
          console.log("Full Presence State:", presenceState); // Inspect the structure

          users.value = Object.keys(presenceState).map((userID) => {
            console.log("Individual Presence Details:", presenceState[userID]); // Inspect each user's details
            const presenceDetails =
              presenceState[userID][0]._rawValue || presenceState[userID][0];
            console.log(
              "presence",
              presenceState[userID][0],
              presenceDetails?.avatar_id
            );

            // Retrieve user details or set defaults
            const userDetails = {
              username:
                presenceDetails?.username ||
                `Guest-${Math.floor(Math.random() * 100000).toString()}`,
              avatarId: presenceDetails?.avatarId || 1,
              flagId: presenceDetails?.flagId || 1,
              rank: presenceDetails?.rank || 1,
              gamesPlayed: presenceDetails?.gamesPlayed || 0,
            };

            return {
              userID,
              ...userDetails, // Spread the userDetails into the returned object
            };
          });
        })

        .on("presence", { event: "join" }, ({ key }: { key: string }) => {
          if (key !== myUserID) {
            // Access the joining user's presence details safely
            const newUserPresence = lobbyChannel.presenceState()[key];

            // Retrieve user details or set defaults
            const userDetails = {
              username:
                newUserPresence?.username ||
                `Guest-${Math.floor(Math.random() * 100000).toString()}`,
              avatarId: newUserPresence?.avatarId || 1,
              flagId: newUserPresence?.flagId || 1,
              rank: newUserPresence?.rank || 1,
              gamesPlayed: newUserPresence?.gamesPlayed || 0,
            };

            users.value.push({
              userID: key,
              ...userDetails, // Spread the userDetails into the new user object
            });
          }
        })

        .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
          users.value = users.value.filter((user) => user.userID !== key);
        })
        .on("broadcast", { event: "game_start" }, (payload: any) => {
          console.log("Received game_start broadcast event", payload);
          const participants = payload.payload.participants;
          console.log("Participants in the broadcast event: ", participants);

          store.setGameId(payload.payload.game_id);

          if (participants.includes(myUserID)) {
            console.log(`Redirecting to game for user: ${myUserID}`);
            router.push({
              name: "OnlineGame",
            });
          } else {
            console.log(
              `User ${myUserID} not in participants. Not redirecting.`
            );
          }
        });

      // Subscribe to the channel
      subscribeAndTrack();

      // Track user presence
      await lobbyChannel.track(userStatus.value);
    });

    onUnmounted(async () => {
      window.removeEventListener("keydown", handleKeyPress);

      // Notify other clients of this user's departure
      lobbyChannel.send({
        type: "presence",
        event: "leave",
        user_id: myUserID,
      });

      // Unsubscribe from the channel
      supabase.removeChannel(lobbyChannel);
    });

    return {
      userIDs,
      users,
      startGame,
      userStatus,
    };
  },
});
</script>

<style scoped>
.lobby-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--menu-height));
}

.users-container {
  width: 100%; /* Adjust width as needed */
  max-width: 600px; /* Or set a maximum width */
  margin: 0 auto; /* This will center your users container */
  text-align: center; /* Center text for child elements */
}
.start-game-container {
  display: flex;
  justify-content: center; /* Center the start game button horizontally */
  margin-top: 20px; /* Add space above the start game button */
}
.shortcut-key {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translate(-50%, 0);
  width: 20px;
  height: 20px;
  background: linear-gradient(to bottom, #f2f2f2, #ccc);
  color: #000;
  text-align: center;
  line-height: 20px;
  border-radius: 3px;
  border: 1px solid white;
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.2), 0px 2px 2px rgba(0, 0, 0, 0.1),
    inset 0px -1px 1px rgba(255, 255, 255, 0.9);
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.option-box {
  position: relative;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  margin: 10px;
}

.users-table {
  width: 100%;
  border-collapse: collapse; /* For a clean table look */
}

.users-table th,
.users-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd; /* Light line between rows */
}

/* Add this CSS in your component's style section or in a separate CSS file */
.alt-row {
  background-color: #29435a; /* Light blue background color */
}

.avatar-img {
  width: 20px;
  height: 20px;
  object-fit: cover;
}

.flag-img {
  height: 16px;
  object-fit: cover;
}
</style>
<!--
Account:
Using Composition API
- Creates User Account site allowing to set and modify name, email, profile picture; shows current stats and coins.
- Data is drawn from supabase table.
-->

<!-- HTML LAYOUT --->
<template>
  <div class="account-container">
    <!-- Left column for avatar, username, and rank -->
    <div class="profile-column">
      <div class="avatar-placeholder">
        <!-- Avatar display -->
        <img
          :src="`/avatars/Head${avatar_id}.webp`"
          alt="User Avatar"
        />
      </div>
      <!-- Flag display under the avatar -->
      <div class="flag-placeholder mt-5">
        <img
          :src="`/flags/Flag${flag_id}.webp`"
          alt="Country Flag"
        />
      </div>

      <div class="username-and-rank">
        <div>
          <h3>Username: {{ username }}</h3>
        </div>
        <div>
          Rank: {{ currentRank }}
        </div>
        <div class="button-box mt-5">
          <!-- Trigger Button for Overlay -->
          <button @click="showAvatarOverlay = true">
            <div class="shortcut-key-small">A</div>Change Avatar
          </button>
        </div>
        <div class="button-box mt-5">
          <!-- Trigger Button for Flag Overlay -->
          <button @click="showFlagOverlay = true">
            <div class="shortcut-key-small">F</div>Change Flag
          </button>
        </div>
      </div>
    </div>

    <!-- Avatar and Flag Selection Overlays -->
    <AvatarSelectionOverlay
      :show="showAvatarOverlay"
      @update-avatar="updateAvatar"
      @close-overlay="showAvatarOverlay = false"
    />

    <FlagSelectionOverlay
      :show="showFlagOverlay"
      @update-flag="updateFlag"
      @close-overlay="showFlagOverlay = false"
    />

    <!-- Right column for user profile details -->
    <form
      class="form-widget user-profile-column"
      @submit.prevent="updateProfile"
    >
      <span class="font-bold underline">User Profile</span>
      <div>
        <span class="font-bold">Email:</span> {{ session.user.email }}
      </div>
      <div>
        <span class="font-bold">Joined on:</span> {{ formatDate(userCreatedAt) }}
      </div>
      <div>
        <p><span class="font-bold">Total Time Played:</span> {{ formattedTotalTimePlayed }}</p>
        <p><span class="font-bold">Number of Games Played:</span> {{ numberOfGamesPlayed }}</p>
      </div>
      <div>
        <span class="font-bold">Doubloons:</span> {{ userCoins }}
      </div>
      <div>
        <!-- *Linked wallet placeholder* -->
      </div>
      <div class="button-box mt-5">
        <button
          type="button"
          @click="goToUpdateUserDetails"
        >
          <div class="shortcut-key-small">U</div>Update User Details
        </button>
      </div>
    </form>
  </div>
</template>


<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  computed,
  onBeforeUnmount,
} from "vue";
import { useStore } from "../stores/store"; // Import the main Pinia store
import { supabase } from "../supabase";
import { useRouter } from "vue-router";
import AvatarSelectionOverlay from "../components/GameItems/AvatarSelectionOverlay.vue";
import FlagSelectionOverlay from "../components/GameItems/FlagSelectionOverlay.vue";

export default defineComponent({
  components: {
    AvatarSelectionOverlay,
    FlagSelectionOverlay,
  },
  setup() {
    // VARIABLES
    const store = useStore(); // Use the Pinia store
    const loading = ref(true);
    const username = ref<string>("");
    const avatar_url = ref<string>("");
    const session = computed(() => store.userSession);
    const userCreatedAt = computed(() => session.value?.user?.created_at);
    const currentRank = computed(() => store.getCurrentRank());
    const userCoins = computed(() => store.userCoins);
    const time_played = ref<number>(0);
    const games_played = ref<number>(0);
    const router = useRouter();

    const showAvatarOverlay = ref(false);
    const avatar_id = ref<number>(15);

    const flag_id = ref<number>(1); // default flag
    const showFlagOverlay = ref(false);

    const formattedTotalTimePlayed = computed(() => {
      const totalSeconds = Math.floor(time_played.value / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    });

    const numberOfGamesPlayed = computed(() => {
      return games_played.value;
    });

    function updateAvatar(newAvatarId: number) {
      avatar_id.value = newAvatarId; // Update the local avatar_id
      updateProfile(); // Update the profile in Supabase
      showAvatarOverlay.value = false; // Close the overlay
    }

    function updateFlag(newFlagId: number) {
      flag_id.value = newFlagId; // Update the local flag_id
      updateProfile(); // Update the profile in Supabase
      showFlagOverlay.value = false; // Close the overlay
    }

    function goToUpdateUserDetails() {
      router.push({ name: "UpdateUserDetails" });
    }

    function formatDate(dateString: string) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    const signOut = async () => {
      await supabase.auth.signOut();
      store.logout();
      router.push("/login").then(() => {
        // Refresh the page after navigating to the login page to reset variables to values in local storage again (e.g. unlocked levels)
        // Note, this could also be done with a flag in storage, indicating values to refresh but used here as a catch all for the logout case for convenience
        location.reload();
      });
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "Account") return;

      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (
        event.key === "u" &&
        !showFlagOverlay.value &&
        !showAvatarOverlay.value
      ) {
        goToUpdateUserDetails();
      }

      if (event.key === "a" && !showFlagOverlay.value) {
        showAvatarOverlay.value = true;
      }

      if (event.key === "c") {
        showAvatarOverlay.value = false;
        showFlagOverlay.value = false;
      }

      if (event.key === "f" && !showAvatarOverlay.value) {
        showFlagOverlay.value = true;
      }
    };

    // FUNCTIONS
    onMounted(async () => {
      window.addEventListener("keydown", handleKeyPress);
      getProfile();
      await store.fetchLastUnlockedLevel(); //needed to load the player rank correctly *NOTE* can we put this in store so that it does not need to be redone every time
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    async function getProfile() {
      try {
        loading.value = true;

        // Guard clause to check if session and user are defined
        if (!session.value || !session.value.user) {
          console.warn("Session or user is not defined");
          return;
        }
        const { user } = session.value;

        let { data, error, status } = await supabase
          .from("profiles")
          .select(
            "username, website, avatar_id, time_played, games_played, flag_id"
          )
          .eq("id", user.id)
          .single();

        if (error && status !== 406) throw error;

        if (data) {
          // Always set these values
          avatar_id.value = data.avatar_id;
          time_played.value = data.time_played;
          games_played.value = data.games_played;
          flag_id.value = data.flag_id;

          // Check and update username if it's null or undefined (indicated first login)
          if (data.username === null || data.username === undefined) {
            const metadata = user.user_metadata;
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ username: metadata.username })
              .eq("id", user.id);

            if (updateError) {
              console.error("Error updating profile:", updateError);
            } else {
              console.log("Profile updated successfully.");
              // Set the updated username
              username.value = metadata.username;
            }
          } else {
            username.value = data.username;
          }
        }
      } catch (error) {
        alert((error as Error).message);
      } finally {
        loading.value = false;
      }
    }

    async function updateProfile() {
      try {
        loading.value = true;
        const { user } = session.value;

        const updates = {
          id: user.id,
          username: username.value,
          avatar_id: avatar_id.value,
          flag_id: flag_id.value,
          updated_at: new Date(),
        };

        let { error } = await supabase.from("profiles").upsert(updates);

        if (error) throw error;
      } catch (error) {
        alert((error as Error).message);
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
      username,
      avatar_url,
      session,
      currentRank,
      formattedTotalTimePlayed,
      numberOfGamesPlayed,
      userCreatedAt,
      updateProfile,
      goToUpdateUserDetails,
      formatDate,
      userCoins,
      signOut,
      showAvatarOverlay,
      avatar_id,
      updateAvatar,
      showFlagOverlay,
      flag_id,
      updateFlag,
    };
  },
});
</script>

<style scoped>
.account-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

.profile-column {
  flex: 1;
  margin-top: 10vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.avatar-placeholder img {
  width: 100px;
}

.shortcut-key-small {
  top: -10px;
  left: 50%;
  transform: translate(-50%, 0);
  position: absolute;
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

button {
  position: relative;
  background: black;
}

.button-box {
  position: relative;
  display: inline-block;
  text-align: left;
}

.username-and-rank {
  margin-top: 20px;
  text-align: center;
}

.user-profile-column {
  flex: 3;
  margin-top: 10vh;
}

.form-widget {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-widget .button.primary {
  align-self: start;
}

/* Responsive design: Stack columns on smaller screens */
@media (max-width: 768px) {
  .account-container {
    flex-direction: column;
  }
}

.flag-placeholder img {
  height: 20px;
}
</style>



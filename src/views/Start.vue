<template>
  <div class="start-page">
    <div class="news-box">
      <span class="text-yellow-500"><b>New:</b></span> <router-link
        to="/news"
        class="footer-link"
      ><u>Update v0.95b</u></router-link>
    </div>
    <div class="options-container">
      <div
        class="option-box"
        @click="navigate('Train')"
      >
        <!-- Call-out section -->
        <div
          v-if="isFirstVisit"
          :class="['call-out', { 'fade-out': fadeOut }]"
          class="call-out"
        >
          <div class="call-out-content">
            <span>Use keyboard shortcuts to navigate</span>
            <img
              src="./parrot_p.webp"
              alt="Parrot"
              class="parrot-image"
            >
          </div>
        </div>
        <!-- Shortcut -->
        <div class="shortcut-key">T</div>
        <img
          src="./train.webp"
          alt="Train"
          class="option-image"
        />
        <p class="bold-text">Train</p>
        <p class="option-description">Practise your ARRRs. Learn how to type like a Pirate here</p>
      </div>
      <div
        class="option-box"
        @click="navigate('CampaignMode')"
      >
        <div class="shortcut-key">C</div>
        <img
          src="./campaign.webp"
          alt="Campaign"
          class="option-image"
        />
        <p class="bold-text">Campaign</p>
        <p class="option-description">Fight other human or machine Pirates and collect shiny booty</p>
      </div>
      <div
        class="option-box"
        @click="navigate('Stats')"
      >
        <div class="shortcut-key">S</div>
        <img
          src="./stats.webp"
          alt="Stats"
          class="option-image"
        />
        <p class="bold-text">Stats</p>
        <p class="option-description">Good Pirates know their strengths. Check yours here</p>
      </div>
    </div>
    <div class="login-section">
      <template v-if="session">
        <div class="button-box mr-3">
          <button @click="navigate('Account')">
            <div class="shortcut-key-small">A</div>Account
          </button>
        </div>
        <div class="button-box">
          <button @click="navigate('TrainingPlan')">
            <div class="shortcut-key-small">P</div>Training Plan
          </button>
        </div>
        <p class="option-description-wide">Check your Account settings or generate a Training Plan</p>
      </template>
      <template v-else>
        <div class="button-box mr-3">
          <button @click="navigate('Login')"><img
              src="./skull_p.webp"
              alt="Skull"
              class="h-5 w-5 mr-2 inline-block"
            />
            <div class="shortcut-key-small">L</div>Login
          </button>
        </div>
        <div class="button-box">
          <button @click="navigate('Register')">
            <div class="shortcut-key-small">R</div>Register
          </button>
        </div>
        <p class="comment text-yellow-500">Login or Register to not loose your Pirate progress</p>
      </template>
    </div>
    <div class="stats-box text-slate-400">
      Total games played: {{ totalGamesPlayed }}, Total time played: {{ formattedTotalTimePlayed }}
    </div>
  </div>
</template>
  
  <script lang="ts">
import {
  defineComponent,
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
} from "vue";
import { useStore } from "../stores/store";
import { useRouter } from "vue-router";
import { supabase } from "../supabase";

export default defineComponent({
  setup() {
    // Router initialization
    const router = useRouter();

    // Pinia store
    const store = useStore();
    const session = computed(() => store.userSession);
    const username = ref<string>("");

    // for display above menu
    const totalGamesPlayed = ref(0);
    const totalTimePlayed = ref(0);

    // First visit check
    const isFirstVisit = ref(true);
    const fadeOut = ref(false);

    const checkFirstVisit = () => {
      isFirstVisit.value = !localStorage.getItem("visited");

      if (!isFirstVisit.value) {
        fadeOut.value = false;
      } else {
        localStorage.setItem("visited", "true");
      }
    };

    const navigate = (routeName: string) => {
      router.push({ name: routeName });
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "Home") return;

      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key === "t") {
        navigate("Train");
      } else if (event.key === "c") {
        navigate("CampaignMode");
      } else if (event.key === "s") {
        navigate("Stats");
      } else if (event.key === "l" && !session.value) {
        navigate("Login");
      } else if (event.key === "r" && !session.value) {
        navigate("Register");
      } else if (event.key === "a" && session.value) {
        navigate("Account");
      } else if (event.key === "f") {
        navigate("OnlineLobby");
      } else if (event.key === "p") {
        navigate("TrainingPlan");
      }
    };

    async function getProfile() {
      try {
        // Guard clause to check if session and user are defined
        if (!session.value || !session.value.user) {
          console.log("No Session defined. Guest user mode.");
          return;
        }

        let { data, error, status } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.value.user.id)
          .single();

        if (error && status !== 406) throw error;

        // Check if username is null or undefined (indicated first login) and set it from auth metadata from registration
        if (data && (data.username === null || data.username === undefined)) {
          let metadata = session.value.user.user_metadata;

          const { error: updateError } = await supabase
            .from("profiles")
            .update({ username: metadata.username })
            .eq("id", session.value.user.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
          } else {
            console.log("Profile updated successfully.");
          }
        } else if (data) {
          username.value = data.username;
        }
      } catch (error) {
        alert((error as Error).message);
      }
    }

    async function fetchGameStats() {
      let { data, error } = await supabase
        .from("total_games")
        .select("total_count, total_time")
        .single();

      if (data && !error) {
        totalGamesPlayed.value = data.total_count;
        totalTimePlayed.value = data.total_time;
      } else {
        console.error("Error fetching game stats:", error);
      }
    }

    const formattedTotalTimePlayed = computed(() => {
      const totalSeconds = Math.floor(totalTimePlayed.value / 1000);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return `${hours}h ${minutes}m`;
    });

    onMounted(async () => {
      checkFirstVisit();
      getProfile();
      await fetchGameStats();
      window.addEventListener("keydown", handleKeyPress);

      if (isFirstVisit.value) {
        setTimeout(() => {
          fadeOut.value = true; // Trigger the fade-out of short cut info overlay after 10 seconds
        }, 10000);
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    return {
      session,
      navigate,
      isFirstVisit,
      fadeOut,
      totalGamesPlayed,
      formattedTotalTimePlayed,
    };
  },
});
</script>
  
<style scoped>
.start-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Adjusted to the height of main menu, min height used so content is not pushed behing main menu on vertical resize */
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

.options-container {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 10px;
}

@media (max-width: 1199px) {
  .options-container {
    flex-wrap: wrap;
  }
}

.option-box {
  position: relative;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  margin: 10px;
}

.option-image {
  max-width: 300px;
  height: auto;
  width: 100%;
  border-radius: 12px;
}

.login-section {
  text-align: center;
  margin-top: 20px;
}

.shortcut-key,
.shortcut-key-small {
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

.shortcut-key {
  top: 10px;
  left: 50%;
  transform: translate(-50%, 0);
}

.shortcut-key-small {
  top: -10px;
  left: 50%;
  transform: translate(-50%, 0);
}

.option-description {
  font-size: 12px;
  text-align: center;
  margin-top: 5px;
  max-width: 250px;
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
}

.option-description-wide {
  font-size: 12px;
  text-align: center;
  margin-top: 5px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
}

.bold-text {
  margin-top: 5px;
  font-weight: bold;
}

.comment {
  margin-top: 5px;
  font-size: 12px;
  text-align: center;
}

.button-box {
  position: relative;
  display: inline-block;
}

.online-players-overlay {
  position: absolute;
  top: 25px;
  right: 8px;
  background-color: #cfbd55e2;
  color: black;
  padding: 5px;
  font-size: 9px;
  z-index: 2;
  border-radius: 5px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.call-out {
  position: absolute;
  top: -50px;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  background-color: rgb(234, 231, 240);
  border-radius: 5px;
  font-size: 10px;
  box-sizing: border-box;
  display: flex;
  padding: 10px;
  z-index: 2;
  align-items: center;
  justify-content: center;
  color: black;
  animation: fadeIn 1s ease-in;
}

.call-out::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background-color: rgb(234, 231, 240);
  z-index: -1;
  animation: fadeIn 1s ease-in;
}

.call-out-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
}

.parrot-image {
  height: 20px;
  margin-left: 5px;
}

.fade-out {
  animation: fadeOut 1s ease-in forwards;
}

.news-box {
  background-color: #3c4c60; /* A blue-gray color */
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 2px;
  padding-bottom: 2px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 13px;
}

.stats-box {
  background-color: #3c4c60; /* A blue-gray color */
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 2px;
  padding-bottom: 2px;
  border-radius: 10px;
  margin-top: 30px;
  font-size: 12px;
}
</style>
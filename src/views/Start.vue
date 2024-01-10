<template>
  <div class="start-page">
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
              src="/parrot_p.png"
              alt="Parrot"
              class="parrot-image"
            >
          </div>
        </div>
        <!-- Shortcut -->
        <div class="shortcut-key">T</div>
        <img
          src="/train.png"
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
          src="/campaign.png"
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
          src="/stats.png"
          alt="Stats"
          class="option-image"
        />
        <p class="bold-text">Stats</p>
        <p class="option-description">Good Pirates know their strengths. Check yours here</p>
      </div>
    </div>
    <div class="login-section">
      <template v-if="userSession">
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
              src="/skull_p.png"
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
        <p class="comment">Login or Register to not loose your Pirate progress</p>
      </template>
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

export default defineComponent({
  setup() {
    // Router initialization
    const router = useRouter();

    // Pinia store
    const store = useStore();
    const userSession = computed(() => store.userSession);

    // First visit check
    const isFirstVisit = ref(true);
    const fadeOut = ref(false);

    const navigate = (routeName: string) => {
      router.push({ name: routeName });
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key === "t") {
        navigate("Train");
      } else if (event.key === "c") {
        navigate("CampaignMode");
      } else if (event.key === "s") {
        navigate("Stats");
      } else if (event.key === "l" && !userSession.value) {
        navigate("Login");
      } else if (event.key === "r" && !userSession.value) {
        navigate("Register");
      } else if (event.key === "a" && userSession.value) {
        navigate("Account");
      } else if (event.key === "f") {
        // direct shortcut to online lobby
        navigate("OnlineLobby");
      } else if (event.key === "p") {
        navigate("TrainingPlan");
      }
    };

    onMounted(async () => {
      window.addEventListener("keydown", handleKeyPress);
      checkFirstVisit();
      setTimeout(() => {
        fadeOut.value = true; // Trigger the fade-out after 5 seconds
      }, 10000);
    });

    const checkFirstVisit = () => {
      if (localStorage.getItem("visited")) {
        isFirstVisit.value = false;
      } else {
        localStorage.setItem("visited", "true");
      }
    };

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    return {
      userSession,
      navigate,
      isFirstVisit,
      fadeOut,
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
}

.options-container {
  display: flex;
  justify-content: center; /* Aligns items in the center of the container */
  flex-wrap: nowrap; /* Prevents wrapping by default */
  gap: 10px; /* You can set a gap between the items */
}

@media (max-width: 1199px) {
  .options-container {
    flex-wrap: wrap; /* Allows items to wrap if the viewport is less than 1200px wide */
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
  /* Allows dynamic resizing to a certain point when screen width reduced */
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
  top: -10px; /* Adjust as needed */
  left: 50%;
  transform: translate(-50%, 0);
}

.option-description {
  font-size: 12px; /* You can adjust this size */
  text-align: center;
  margin-top: 5px; /* Optional, for a bit of spacing */
  max-width: 250px; /* Same as the width of the image */
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
}

.option-description-wide {
  font-size: 12px; /* You can adjust this size */
  text-align: center;
  margin-top: 5px; /* Optional, for a bit of spacing */
  max-width: 400px; /* Same as the width of the image */
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
}

.bold-text {
  margin-top: 5px; /* Optional, for a bit of spacing */
  font-weight: bold;
}

.comment {
  margin-top: 5px; /* Optional, for a bit of spacing */
  font-size: 12px; /* You can adjust this size */
  text-align: center;
}

.button-box {
  position: relative;
  display: inline-block;
}

.online-players-overlay {
  /* Existing styles */
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
  box-sizing: border-box; /* Include padding and border in the element's total width and height */
  display: flex;
  padding: 10px;
  z-index: 2;
  align-items: center; /* Ensures vertical alignment */
  justify-content: center; /* Centers content horizontally */
  color: black;
  animation: fadeIn 1s ease-in;
}

.call-out::after {
  content: "";
  position: absolute;
  bottom: -5px; /* Adjust to align with the top of 'T' */
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
  align-items: center; /* Vertical alignment */
  justify-content: center; /* Horizontal alignment */
  padding: 5px; /* Padding around text and image */
}

.parrot-image {
  height: 20px; /* Adjusted as requested */
  margin-left: 5px;
}

.fade-out {
  animation: fadeOut 1s ease-in forwards; /* 1 second fade-out animation */
}
</style>
  
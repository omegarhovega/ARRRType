<template>
  <div class="training-mode-selector">

    <div class="mode-boxes-container">
      <div
        class="training-mode-box"
        @click="setMode('random')"
      >
        <div class="shortcut-key">R</div>
        <img
          src="/random.png"
          alt="Random words"
          class="mode-image"
        />
        <p class="bold-text">Random words</p>
        <p class="option-description">Go Freestyle with games of random words</p>
      </div>
      <div
        class="training-mode-box"
        @click="setMode('words')"
      >
        <div class="shortcut-key">M</div> <!-- Shortcut Key -->
        <img
          src="/mistakes.png"
          alt="Mistakes"
          class="mode-image"
        />
        <p class="bold-text">Learn from mistakes</p>
        <p class="option-description">Automated training based on what you struggle with</p>
      </div>
      <div
        class="training-mode-box"
        @click="setMode('text')"
      >
        <div class="shortcut-key">T</div> <!-- Shortcut Key -->
        <img
          src="/text3.png"
          alt="Text"
          class="mode-image"
        />
        <p class="bold-text">Texts</p>
        <p class="option-description">Train whole text passages for real-world speed</p>
      </div>
    </div>
    <div class="mode-boxes-container mt-5">
      <div
        class="training-mode-box"
        @click="setMode('single')"
      >
        <div class="shortcut-key">S</div> <!-- Shortcut Key -->
        <img
          src="/single3.png"
          alt="Single"
          class="mode-image"
        />
        <p class="bold-text">Single words</p>
        <p class="option-description">Type single words that appear one after the other</p>
      </div>
      <div
        class="training-mode-box"
        @click="navigate('KeySelector')"
      >
        <div class="shortcut-key">K</div> <!-- Shortcut Key -->
        <img
          src="/keys_p.png"
          alt="Keys"
          class="mode-image"
        />
        <p class="bold-text">Keys</p>
        <p class="option-description">Keep missing those ARRRs? Train individual keys here.</p>
      </div>
      <div
        class="training-mode-box"
        @click="navigate('TextSelector')"
      >
        <div class="shortcut-key">C</div> <!-- Shortcut Key -->
        <img
          src="/words_p.png"
          alt="Single"
          class="mode-image"
        />
        <p class="bold-text">Custom text</p>
        <p class="option-description">Input your own pirate texts to type</p>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { defineComponent, computed, onBeforeUnmount } from "vue";
import { useStore } from "../../stores/store";
import { useRouter } from "vue-router"; // Import useRouter

export default defineComponent({
  setup() {
    const router = useRouter(); // Initialize router
    const store = useStore();
    const userSession = computed(() => store.userSession);

    const navigate = (routeName: string) => {
      router.push({ name: routeName });
    };

    const setMode = (mode: "random" | "words" | "text" | "single") => {
      console.log("Setting mode in TrainingModeSelector to:", mode);
      store.setTrainingParams(mode, "3");
      console.log(
        "After setting, mode in TrainingModeSelector is:",
        store.selectedMode
      );

      // Navigate to the specific training mode
      if (mode === "single") {
        router.push({ name: "TrainSingle" }); // Navigate to the static 'TrainSingle' route
      } else {
        router.push({ name: "TrainMode", params: { mode } }); // Navigate to the dynamic 'TrainMode' route
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key === "k") {
        navigate("KeySelector");
      }

      if (event.key === "c") {
        navigate("TextSelector");
      }

      const modeMap: {
        [key: string]: "random" | "words" | "text" | "single";
      } = {
        r: "random",
        m: "words",
        t: "text",
        s: "single",
      };

      const mode = modeMap[event.key.toLowerCase()];
      if (mode) {
        setMode(mode);
      }
    };

    // Add and remove the event listener for keypress
    const addKeyPressListener = () =>
      window.addEventListener("keydown", handleKeyPress);
    const removeKeyPressListener = () =>
      window.removeEventListener("keydown", handleKeyPress);

    // Lifecycle hooks
    addKeyPressListener();
    onBeforeUnmount(removeKeyPressListener);

    return {
      setMode, // Make setMode available to the template
      userSession,
      navigate,
    };
  },
});
</script>

<style scoped>
.training-mode-selector {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Adjusted to the height of main menu, min height used so content is not pushed behing main menu on vertical resize */
}

.mode-boxes-container {
  display: flex;
  justify-content: center; /* Aligns items in the center of the container */
  flex-wrap: nowrap; /* Prevents wrapping by default */
}

@media (max-width: 1199px) {
  .mode-boxes-container {
    flex-wrap: wrap; /* Allows items to wrap if the viewport is less than 1200px wide */
  }
}

.training-mode-box {
  position: relative;
  text-align: center;
  cursor: pointer;
  width: 25%; /* Example percentage width - adjust as needed */
  max-width: 300px; /* Control the maximum size */
  padding: 10px;
}

.training-mode-box p {
  white-space: normal; /* Allow wrapping */
  word-wrap: break-word; /* Break words as needed */
  text-align: center; /* Center-align text */
  margin: 0 auto; /* Auto margins for centering */
}

.mode-image {
  /* Allows dynamic resizing to a certain point when screen width reduced */
  max-width: 300px; /* Maximum width is 100% of the container */
  width: 100%; /* Width is 100% of the container */
  height: auto; /* Height will scale automatically */
  border-radius: 12px;
}

@media (max-width: 1199px) {
  .training-mode-box {
    width: 48%; /* Larger width when fewer items per row */
  }
}

@media (max-width: 768px) {
  .training-mode-box {
    width: 100%; /* Full width for smaller screens */
  }
}

.shortcut-key {
  position: absolute;
  top: 0px;
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
.bold-text {
  margin-top: 5px; /* Optional, for a bit of spacing */
  font-weight: bold;
}
.option-description {
  font-size: 12px; /* You can adjust this size */
  text-align: center;
  margin-top: 5px; /* Optional, for a bit of spacing */
  max-width: 300px; /* Same as the width of the image */
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
}
</style>

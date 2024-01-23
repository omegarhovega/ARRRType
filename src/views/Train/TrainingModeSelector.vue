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
import { useRouter } from "vue-router";

export default defineComponent({
  setup() {
    const router = useRouter();
    const store = useStore();
    const userSession = computed(() => store.userSession);

    const navigate = (routeName: string) => {
      router.push({ name: routeName });
    };

    const setMode = (mode: "random" | "words" | "text" | "single") => {
      store.setTrainingParams(mode, "3");

      // Navigate to the specific training mode
      if (mode === "single") {
        router.push({ name: "TrainSingle" }); // Navigate to the static 'TrainSingle' route
      } else {
        router.push({ name: "TrainMode", params: { mode } }); // Navigate to the dynamic 'TrainMode' route
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "Train") return;

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
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

.mode-boxes-container {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
}

@media (max-width: 1199px) {
  .mode-boxes-container {
    flex-wrap: wrap;
  }
}

.training-mode-box {
  position: relative;
  text-align: center;
  cursor: pointer;
  width: 25%;
  max-width: 300px;
  padding: 10px;
}

.training-mode-box p {
  white-space: normal;
  word-wrap: break-word;
  text-align: center;
  margin: 0 auto;
}

.mode-image {
  /* Allows dynamic resizing to a certain point when screen width reduced */
  max-width: 300px;
  width: 100%;
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
  margin-top: 5px;
  font-weight: bold;
}
.option-description {
  font-size: 12px;
  text-align: center;
  margin-top: 5px;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
}
</style>

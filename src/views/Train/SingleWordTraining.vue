<template>
  <train-sub-menu-single
    @numberOfWordsChanged="resetGame"
    @randomizationStatusChanged="resetGame"
  />

  <!-- for mobile keyboard -->
  <input
    ref="hiddenInput"
    class="hidden-input"
    id="hidden"
  />
  <div id="root">

    <div :style="containerStyle">
      <div
        v-if="isCapsLockOn"
        id="capslock-overlay"
      >
        <div class="message">Caps Lock is on</div>
      </div>
      <div
        v-if="!loading"
        class="line-wrapper text-xl"
        id="speed-text"
      >
        <div
          class="chevron"
          :style="{ top: `${chevronTop}px`, left: `${chevronLeft}px` }"
        ></div>
        <div
          v-if="showCountdown"
          id="tooltip"
          class="absolute text-gray-700 py-1 px-3 rounded shadow-lg"
        >
          <template v-if="countdown > 0">
            {{ countdown }}
          </template>
          <template v-else-if="countdownFinished">
            <img
              src="/skull_p.png"
              alt="Skull"
              width="22"
              height="22"
            />
          </template>
        </div>
        <span
          v-for="(char, index) in currentWordArray"
          :key="index"
          ref="charSpans"
          class="char"
          :class="{
         correct: index < currentWordCharIndex && typed[index] === currentWord[index],
         incorrect: index < currentWordCharIndex && typed[index] !== currentWord[index]
        }"
        >
          {{ char }}
        </span>
      </div>
    </div>
    <div
      v-if="isFinished"
      id="overlay"
    >
      <div
        id="wpm-stat"
        class="text-xl"
      >
        <p>Your Average WPM: {{ averageWPM.toFixed(0) }}</p>
        <p>Your Average Accuracy: {{ averageAccuracy.toFixed(0) }}%</p>
        <p>Note: Results from Single Word Training are not saved.</p>
        <div class="training-mode-box mt-3">
          <div class="shortcut-key text-base">1</div><button @click="initializeWrapper">Restart</button>
        </div>
        <div class="training-mode-box mt-3">
          <div class="shortcut-key text-base">2</div><button @click="navigateToTrain">Change Training Mode</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
  computed,
  ref,
} from "vue";
import {
  initializeSingleWordTraining,
  currentWord,
  averageWPM,
  averageAccuracy,
  currentWordCharIndex,
  fetchedWords,
  currentWordIndex,
  singleWordStatsList,
  detectCapsLock,
  setupKeyboardEvent,
  isFinished,
  charSpans,
} from "../../components/SingleTrainLogic";
import { useStore } from "../../stores/store";
import { useUtilities } from "../../components/Utilities";
import { useGameStateManagement } from "../../components/GameStateManagement";
import { useCountdownLogic } from "../../components/CountdownLogic";
import { useRouter } from "vue-router";
import trainSubMenuSingle from "./TrainSubMenuSingle.vue";

export default defineComponent({
  components: {
    trainSubMenuSingle,
  },
  setup() {
    //Router inititalisation
    const router = useRouter();

    const store = useStore();

    const isCapsLockOn = computed(() => store.isCapsLockOn);
    const loading = ref(true);

    // check if mobile device
    const hiddenInput = ref<HTMLElement | null>(null);

    function isMobileDevice() {
      const userAgent = navigator.userAgent;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    }

    function resetGame() {
      // resets game logic to reload text with randomized upper/lower case characters and signs
      initializeWrapper(event as unknown as MouseEvent);
    }

    const chevronTop = ref(0);
    const chevronLeft = ref(0);

    const { useChevronAnimation, resetChevronPosition } = useUtilities();
    useChevronAnimation(charSpans, chevronTop, chevronLeft);

    const typed = computed(() => store.typed);
    const typedIndices = computed(() => store.typedIndices);
    // blur background while results tooltip is overlayed
    const containerStyle = computed(() => ({
      filter: isFinished.value ? "blur(5px)" : "none",
    }));

    const gameStateManagement = useGameStateManagement();
    const { resetGameState } = gameStateManagement;

    const {
      countdown,
      countdownFinished,
      showCountdown,
      stopCountdown,
      countdownStart,
    } = useCountdownLogic(async () => {
      // Actions to perform when the countdown ends:
      initializeSingleWordTraining(); // startGame method includes setting start time and allows typing
      window.removeEventListener("keydown", handleKeyDown); // Remove previous keydown listener if any
      window.addEventListener("keydown", handleKeyDown); // Add new keydown listener
    });

    const {
      handleKeyDown,
      initialize,
      recalculateCurrentWord,
      currentWordArray,
    } = setupKeyboardEvent(
      resetGameState,
      resetChevronPosition,
      chevronTop,
      chevronLeft,
      countdownStart,
      stopCountdown,
      isFinished
    );

    // Inside your setup function
    const initializeWrapper = (event: MouseEvent) => {
      initialize(
        resetGameState,
        resetChevronPosition,
        countdownStart,
        isFinished,
        recalculateCurrentWord,
        currentWordArray
      );
    };

    function navigateToTrain() {
      router.push({ name: "Train" });
    }

    function handleOverlayKeyPress(event: KeyboardEvent) {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "TrainSingle") return;

      if (isFinished.value) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
          return;
        }
        switch (event.key.toUpperCase()) {
          case "1":
            initializeWrapper(event as unknown as MouseEvent);
            break;
          case "2":
            navigateToTrain();
            break;
        }
      }
    }

    // Initialize the game
    onMounted(async () => {
      // check if mobile device
      if (isMobileDevice() && hiddenInput.value) {
        hiddenInput.value.focus();
      }
      initializeWrapper(new MouseEvent("click"));
      loading.value = false;
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keydown", detectCapsLock);
      window.addEventListener("keyup", detectCapsLock);
      window.addEventListener("keydown", handleOverlayKeyPress);
    });

    // Fail-save to allow stopping games with abrupt unmountings
    onBeforeUnmount(() => {
      // Clean up all game activities
      resetGameState();
      stopCountdown();
      window.removeEventListener("keydown", handleKeyDown);
    });

    onUnmounted(() => {
      resetGameState();
      stopCountdown();
      fetchedWords.value = [""];
      recalculateCurrentWord();
      currentWordArray;
      currentWordIndex.value = 1;
      currentWordCharIndex.value = 0;
      currentWord.value = "";
      singleWordStatsList.length = 0;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", detectCapsLock);
      window.removeEventListener("keyup", detectCapsLock);
      window.removeEventListener("keydown", handleOverlayKeyPress);
    });

    return {
      loading,
      showCountdown,
      countdown,
      countdownFinished,
      isFinished,
      currentWord,
      averageWPM,
      averageAccuracy,
      initializeWrapper,
      navigateToTrain,
      chevronTop,
      chevronLeft,
      currentWordArray,
      charSpans,
      typed,
      typedIndices,
      currentWordCharIndex,
      isCapsLockOn,
      containerStyle,
      resetGame,
      hiddenInput,
    };
  },
});
</script>

<style scoped>
#root {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Adjusted to the height of main menu, min height used so content is not pushed behing main menu on vertical resize */
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

#tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  margin-bottom: 10px;
  z-index: 100;
  background-color: #e6b800;
  border-radius: 10px;
  color: black;
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
}

#overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background-color: #2d4053;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.chevron {
  position: absolute;
  top: 1px;
  left: 0px;
  height: 28px;
  width: 2px; /* Change this to make the line thicker or thinner */
  background-color: #e69500;
  z-index: 1000; /* Ensure it's above the text but below other overlays */
  transition: top 0.1s ease, left 0.1s ease;
}
.line-wrapper {
  position: relative;
}
.char.correct {
  color: #d5ddd7;
  opacity: 0.4;
}

.char.incorrect {
  color: red;
  border-bottom: 2px solid red;
  opacity: 0.25;
}

#capslock-overlay {
  position: absolute;
  left: 0; /* Align to the left */
  bottom: 100%; /* Position above the typing test box */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  width: 100%; /* Optional: Set the width to match the typing test box */
}

#capslock-overlay .message {
  background-color: #2d4053;
  padding: 10px;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  pointer-events: none;
}

.training-mode-box {
  position: relative;
  text-align: center;
  cursor: pointer;
}
.shortcut-key {
  position: absolute;
  top: -10px;
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
</style>
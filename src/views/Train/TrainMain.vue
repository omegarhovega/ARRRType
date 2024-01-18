<!--
Train
Using Composition API
- Allows users to train typing
- Can set opponent (progress visible) and opponent speed via TrainSubMenu
-->
<template>
  <div id="root">
    <!-- reloads typing test with new opponent WPM when WPM dropdown is changed using reset function below, event from TrainSubMenu -->
    <train-sub-menu
      @opponentWpmChanged="resetGame"
      @numberOfWordsChanged="resetGameForNumberOfWordsChanged"
      @opponentStatusChanged="handleOpponentStatusChange"
      @randomizationStatusChanged="resetGameForRandomization"
      @endGameStatusChanged="resetGameForNoEndWithoutMistakeCorrection"
    />

    <!-- for mobile keyboard -->
    <input
      ref="hiddenInput"
      class="hidden-input"
      id="hidden"
    />
    <div
      id="container"
      class="fixed left-0 w-full z-50"
      :style="containerStyle"
    >
      <!-- Player Progress Bar -->
      <PlayerProgress
        :progress="currentProgress"
        :loading="loading"
      />
      <!-- Opponent Progress -->
      <template v-if="opponentEnabled">
        <!-- Opponent Progress Bar -->
        <OpponentProgress
          :opponents="opponentsData"
          :loading="loading"
        />
      </template>
      <div
        v-if="!loading"
        class="w-2/3 mx-auto line-wrapper"
      >
        <!-- *NOTE* scroll container is drawn from here, careful if other elements are added inside other than text -->
        <div
          class="chevron"
          :style="{ top: `${chevronTop}px`, left: `${chevronLeft}px` }"
        ></div>
        <div
          id="speed-text"
          ref="scrollContainer"
          class="text-xl"
        >
          <!-- Countdown -->
          <CountdownTimer
            :countdown="countdown"
            :showCountdown="showCountdown"
            :countdownFinished="countdownFinished"
          />

          <!-- Game Text -->
          <GameTextDisplay
            :chevronTop="chevronTop"
            :chevronLeft="chevronLeft"
            :gameText="chars"
            :typedText="typed"
            :currentCharIndex="currentIndexWatcher"
            :charSpansDOM="charSpans"
          />
        </div>
        <!-- Mistakes, CapsLock overlay -->
        <OverlayMessages
          :isCapsLockOn="isCapsLockOn"
          :hasMistake="hasMistake"
          :isFinished="isFinished"
        />
      </div>
    </div>
    <!-- Game statistics overlay after game end -->
    <GameStatsComputer
      :opponentWpmFromStore="opponentWpmFromStore"
      :isFinished="isFinished"
      :resultMessage="resultMessage"
      :wpm="wpm"
      :grossWpm="grossWpm"
      :accuracy="accuracy"
      :timeDifference="timeDifference"
      :totalKeystrokes="totalKeystrokes"
      :displayAccuracyWarning="displayAccuracyWarning"
      :loadNewGame="loadNewGame"
      :navigateToTrain="navigateToTrain"
      :navigateToUserStats="navigateToUserStats"
      :selectedMode="selectedMode"
      :doStatistics="doStatistics"
    />
  </div>
</template>

<script lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  defineComponent,
  watch,
  nextTick,
  onBeforeUnmount,
} from "vue";
import type { Ref, ComponentPublicInstance } from "vue";
import trainSubMenu from "./TrainSubMenu.vue";
import { useStore } from "../../stores/store";
import { useOpponentLogic } from "../../components/OpponentLogic";
import { useTypingTextHandler } from "../../components/TypingTextHandler";
import { useCountdownLogic } from "../../components/CountdownLogic";
import { useGameStateManagement } from "../../components/GameStateManagement";
import { useUtilities } from "../../components/Utilities";
import {
  grossWpmPerSecond,
  useUserStatistics,
} from "../../components/UserStatistics";
import { useRouter } from "vue-router";
import PlayerProgress from "../../components/GameItems/PlayerProgress.vue";
import OpponentProgress from "../../components/GameItems/OpponentProgress.vue";
import GameTextDisplay from "../../components/GameItems/GameTextDisplay.vue";
import CountdownTimer from "../../components/GameItems/CountdownTimer.vue";
import OverlayMessages from "../../components/GameItems/OverlayMessages.vue";
import GameStatsComputer from "../../components/GameItems/GameStatsComputer.vue";

export default defineComponent({
  components: {
    trainSubMenu,
    PlayerProgress,
    OpponentProgress,
    GameTextDisplay,
    CountdownTimer,
    OverlayMessages,
    GameStatsComputer,
  },
  setup() {
    // -----------------------------------
    // Variables and general functionality
    // -----------------------------------
    //Router inititalisation
    const router = useRouter();

    // Pinia store
    const store = useStore();

    // Refs
    const chevronTop: Ref<number> = ref(0);
    const chevronLeft: Ref<number> = ref(0);
    const charSpans: Ref<(Element | ComponentPublicInstance)[]> = ref([]); // span elements for each character in the DOM to establish pixel position
    const scrollContainer = ref<HTMLElement | null>(null);
    const tooltipTimeoutId = ref<number | null>(null);
    const countdownInterval = ref<number | null>(null);
    const noEndWithoutCorrection = computed(
      () => store.noGameEndWithoutMistakeCorrection
    );

    // Computed from Pinia Storage
    const opponentWpmFromStore = computed(() => store.opponentWPM);
    const totalKeystrokes = computed(() => store.totalKeystrokes);
    const correctKeystrokes = computed(() => store.correctKeystrokes);
    const currentChar = computed(() =>
      fetchedText.value.charAt(store.currentIndex)
    );
    const isFinished = computed(() => store.endTime !== null);
    const typed = computed(() => store.typed);
    const typedIndices = computed(() => store.typedIndices);
    const isCapsLockOn = computed(() => store.isCapsLockOn);
    const loading = computed(() => store.loading); // *NOTE* check if moving to this file from storage improves loading performance
    const startTyping = computed(() => store.startTyping);
    const errors = computed(() => store.errors);
    const currentIndexWatcher = computed(() => store.currentIndex);
    const noGameEndWithoutMistakeCorrection = computed(
      () => store.noGameEndWithoutMistakeCorrection
    );
    const selectedMode = computed(() => store.selectedMode);
    const doStatistics = computed(
      () => selectedMode.value !== "keys" && selectedMode.value !== "custom"
    );

    // check if mobile device
    const hiddenInput = ref<HTMLElement | null>(null);

    function isMobileDevice() {
      const userAgent = navigator.userAgent;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    }

    function resetGameForRandomization() {
      // resets game logic to reload text with randomized upper/lower case characters and signs
      resetGame(opponentWpmFromStore.value);
    }

    function resetGameForForceMistakeCorrection() {
      resetGame(opponentWpmFromStore.value);
      resetHasMistake();
    }

    function resetGameForNoEndWithoutMistakeCorrection() {
      resetGame(opponentWpmFromStore.value);
    }

    function resetGameForNumberOfWordsChanged() {
      resetGame(opponentWpmFromStore.value);
    }

    const currentProgressNet = computed(() => {
      // Access uniqueCorrectIndices from the store
      const uniqueCorrectIndices = store.uniqueCorrectIndices;
      // Count the number of true values in uniqueCorrectIndices
      const correctCount = uniqueCorrectIndices.reduce(
        (acc, cur) => acc + (cur ? 1 : 0),
        0
      );
      // Calculate the current progress
      return (correctCount / uniqueCorrectIndices.length) * 100; // percentage
    });

    const currentProgressGross = computed(() => {
      // Calculate the current progress
      return (currentIndexWatcher.value / fetchedText.value.length) * 100; // percentage
    });

    // check if condition is that game cannot end without correction and adjust progress measure accordingly
    const currentProgress = computed(() => {
      // Directly referencing noGameEndWithoutMistakeCorrection to establish a dependency
      const progressMode = noGameEndWithoutMistakeCorrection.value
        ? currentProgressNet
        : currentProgressGross;
      return progressMode.value;
    });

    // Computed other
    // Simulated opponent progress
    const opponentsData = computed(() => {
      return [
        {
          id: "1",
          name: "Opponent", // Replace with actual name if available
          progress: opponentProgress.value || 0,
        },
      ];
    });

    const updateCharSpans = () => {
      // Ensure this runs after the DOM updates
      nextTick(() => {
        const spans = document.querySelectorAll("#speed-text span");
        charSpans.value = Array.from(spans);
      });
    };

    // indicate in end of game overlay when results are not saved due to accuracy being 50% or below
    const displayAccuracyWarning = computed(() => {
      return accuracy.value <= 50;
    });
    // blur background while results tooltip is overlayed
    const containerStyle = computed(() => ({
      filter: isFinished.value ? "blur(5px)" : "none",
    }));
    // result Message overlay
    const resultMessage = computed(() => {
      if (opponentEnabled.value) {
        return wpm.value > opponentWpmFromStore.value
          ? "You won!"
          : wpm.value < opponentWpmFromStore.value
          ? "You lost!"
          : "It's a tie!";
      } else {
        return "You made it!";
      }
    });

    // Import general utility functions
    const {
      useTextManagement,
      useChevronAnimation,
      resetChevronPosition,
      useTimeDifference,
      saveTotalTimePlayed,
    } = useUtilities();

    // formatting time for display in overlay at game end
    const timeDifference = useTimeDifference();

    // ----------
    // Game Logic
    // ----------
    // ----------------------
    // 1. Load Necessary Data
    // ----------------------
    // load text from database depending on training mode -> called in onMounted()
    const { fetchedText, chars, fetchText } = useTextManagement(
      store.selectedMode,
      store.selectedWordLength
    );

    // ------------------
    // 2. Start Countdown
    // ------------------
    // key function to trigger game start and progression -> called in onMounted()
    const {
      countdown,
      countdownFinished,
      showCountdown,
      stopCountdown,
      countdownStart,
    } = useCountdownLogic(() => {
      // Actions to perform when the countdown ends:
      startGame(); // startGame method includes setting start time and allows typing
      if (opponentEnabled.value) {
        startOpponentProgress(); // starts virtual opponent if enabled
      }
      startWpmTracking(); // used to measure Wpm per second tracking
      startIndexTracking(); // used to measure which word is currently typed
      window.removeEventListener("keydown", handleKeyDown); // Remove previous keydown listener if any
      window.addEventListener("keydown", handleKeyDown); // Add new keydown listener
    });

    //--------------
    // 3. Start Game
    // -------------
    const gameStateManagement = useGameStateManagement();

    const {
      startGame,
      endGame,
      resetGameState,
      stopGameActivities,
      resetGameActivities,
    } = gameStateManagement;

    // --------------------------------------------
    // 4. Handle Game Inputs, Formatting, Scrolling
    // --------------------------------------------
    // Opponent Logic (if enabled)
    const {
      startOpponentProgress,
      opponentEnabled,
      opponentProgress,
      stopOpponentProgress,
      resetOpponentProgress,
      handleOpponentStatusChange,
    } = useOpponentLogic(
      fetchedText,
      opponentWpmFromStore,
      () => {
        handleGameEnd(); // handle case opponent finishes first
      },
      (status: boolean, opponentWpm: number) => {
        // handles changing opponent settings in Training with reload/reset (currently not in use as done above)
      }
    );

    // Handle user inputs
    // Main functionality for dealing with typed inputs during game runtime
    let typingTextHandler: any;

    if (noEndWithoutCorrection.value) {
      typingTextHandler = useTypingTextHandler(
        fetchedText,
        scrollContainer,
        () => handleGameEnd(),
        currentChar,
        currentProgress,
        noEndWithoutCorrection
      );
    } else {
      typingTextHandler = useTypingTextHandler(
        fetchedText,
        scrollContainer,
        () => handleGameEnd(),
        currentChar
      );
    }

    const {
      accuracy,
      totalOccurrences,
      mistakesMade,
      hasMistake,
      removeKeyDownListener,
      detectCapsLock,
      handleKeyDown,
      deleteLastChar,
      deleteLastWord,
      typeChar,
      startIndexTracking,
      stopIndexTracking,
      resetHasMistake,
    } = typingTextHandler;

    // watch position of current character in DOM for chevron positioning
    useChevronAnimation(charSpans, chevronTop, chevronLeft);

    // --------------------
    // 5. Handle Statistics
    // --------------------
    // Logging user statistics
    // importing functionality for stats, tracking, measurement, saving, update and reset
    const {
      wpm,
      grossWpm,
      consistencyForStat,
      resetStats,
      updateStats,
      saveStats,
      startWpmTracking,
      stopWpmTracking,
      calculateConsistency,
      wpmPerSecond,
      saveGameStatistics,
    } = useUserStatistics();

    // ------------
    // 6. On Finish
    // ------------
    // A) Stop Game Logic
    // B) Save Statistics
    // C) Reset All Relevant Game Variables
    // *NOTE* removed watcher for endTime and handle gameEnd through flow alone

    function handleGameEnd() {
      // triggers overlay above
      endGame(removeKeyDownListener); // *NOTE* sequence important since some functions check if there is an endTime which is set here
      stopGameActivities(
        stopOpponentProgress,
        stopWpmTracking,
        stopIndexTracking,
        stopCountdown
      );
      if (doStatistics.value) {
        saveGameStatistics(
          wpm,
          grossWpm,
          accuracy,
          errors,
          wpmPerSecond,
          grossWpmPerSecond,
          totalOccurrences,
          mistakesMade,
          consistencyForStat,
          updateStats,
          saveStats
        );
      } else {
        // modes where no stats are measured
      }
      saveTotalTimePlayed();
    }

    function resetGame(newWpm: number) {
      // Reset other game variables

      stopGameActivities(
        stopOpponentProgress,
        stopWpmTracking,
        stopIndexTracking,
        stopCountdown
      );
      resetGameActivities(resetOpponentProgress, resetGameState, resetStats);
      if (store.selectedMode === "keys") {
        const selectedKeys = JSON.parse(
          localStorage.getItem("selectedKeys") || "[]"
        );
        fetchText(store.numberOfWords, selectedKeys);
      } else {
        fetchText(store.numberOfWords);
      }
      countdownStart(); // from CountdownLogic, starts new countdown and on countdown end starts new game (see above)
      resetChevronPosition(chevronTop, chevronLeft);

      // Update the opponent's WPM if needed
      store.setOpponentWPM(newWpm);
      resetHasMistake();
      // Update charSpans after the game text is reset
      updateCharSpans();
    }

    // functionality for buttons at game end
    function loadNewGame() {
      resetGame(opponentWpmFromStore.value);
    }

    function navigateToUserStats() {
      router.push({ name: "LastRoundStats" });
    }

    function navigateToTrain() {
      router.push({ name: "Train" });
    }

    function handleOverlayKeyPress(event: KeyboardEvent) {
      if (isFinished.value) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
          return;
        }
        switch (event.key.toUpperCase()) {
          case "1":
            loadNewGame();
            break;
          case "2":
            navigateToTrain();
            break;
          case "3":
            if (doStatistics.value) {
              // Condition only works in modes where stats are measured
              navigateToUserStats();
            }
            break;
        }
      }
    }

    // Lifecycle hooks *NOTE* check
    onMounted(async () => {
      // check if mobile device
      if (isMobileDevice() && hiddenInput.value) {
        hiddenInput.value.focus();
      }
      // check last user setting for virtual opponent, if none, enable opponent by default
      const storedOpponentStatus = localStorage.getItem("opponentEnabled");
      if (storedOpponentStatus !== null) {
        store.setOpponentEnabled(JSON.parse(storedOpponentStatus));
      }
      if (store.selectedMode === "keys") {
        const selectedKeys = JSON.parse(
          localStorage.getItem("selectedKeys") || "[]"
        );
        await fetchText(store.numberOfWords, selectedKeys);
      } else {
        await fetchText(store.numberOfWords);
      }
      // Update charSpans after the game text is reset
      updateCharSpans();
      countdownStart(); // countdown should only begin when text is fetched; start game logic triggered when countdown is finished
      window.addEventListener("keydown", handleOverlayKeyPress);
    });

    // Fail-save to allow stopping games with abrupt unmountings *CHECK if needed*
    onBeforeUnmount(() => {
      // Clean up all game activities
      stopGameActivities(
        stopOpponentProgress,
        stopWpmTracking,
        stopIndexTracking,
        stopCountdown
      );
      // Remove all global event listeners
      window.removeEventListener("keydown", handleKeyDown);

      // Ensure all game state is reset or saved
      resetGameState();
    });

    onUnmounted(() => {
      stopGameActivities(
        stopOpponentProgress,
        stopWpmTracking,
        stopIndexTracking,
        stopCountdown
      );
      // *NOTE* check if stats reset affects displaying the last round stats since userStats is cleared (should grab from local storage)
      resetGameActivities(
        resetOpponentProgress,
        resetGameState, // from GameStateManagement
        resetStats // from UserStatistics, *NOTE* prevent from removing local storage data that needs to be kept
      );
      removeKeyDownListener();
      fetchedText.value = ""; // clear data, incl. chars which are calculated from it
      window.removeEventListener("keydown", handleOverlayKeyPress);
    });

    return {
      currentIndexWatcher,
      countdown,
      correctKeystrokes,
      countdownFinished,
      loading,
      fetchedText,
      opponentProgress,
      showCountdown,
      startTyping,
      tooltipTimeoutId,
      typed,
      typedIndices,
      isCapsLockOn,
      accuracy,
      chars,
      containerStyle,
      currentChar,
      isFinished,
      opponentWpmFromStore,
      wpm,
      grossWpm,
      resultMessage,
      opponentEnabled,
      countdownInterval,
      scrollContainer,
      errors,
      totalKeystrokes,
      charSpans,
      chevronTop,
      chevronLeft,
      timeDifference,
      displayAccuracyWarning,
      currentProgress,
      hasMistake,
      handleOverlayKeyPress,
      handleOpponentStatusChange,
      countdownStart,
      resetGame,
      handleKeyDown,
      deleteLastChar,
      deleteLastWord,
      typeChar,
      fetchText,
      detectCapsLock,
      calculateConsistency,
      loadNewGame,
      navigateToUserStats,
      resetChevronPosition,
      resetGameForRandomization,
      navigateToTrain,
      resetGameForForceMistakeCorrection,
      resetGameForNoEndWithoutMistakeCorrection,
      opponentsData,
      updateCharSpans,
      resetGameForNumberOfWordsChanged,
      selectedMode,
      doStatistics,
      hiddenInput,
    };
  },
});
</script>

<style scoped>
#container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Adjusted to the height of main menu, min height used so content is not pushed behing main menu on vertical resize */
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

#speed-text {
  white-space: normal;
  text-align: justify;
  overflow-wrap: break-word;
  height: 90px; /* *NOTE* important to have aligned with scroll funtion */
  overflow-y: auto;
}

#speed-text::-webkit-scrollbar {
  display: none; /* Hide scrollbar for Chrome, Safari, and Opera */
}
#speed-text {
  -ms-overflow-style: none; /* Hide scrollbar for IE and Edge */
  scrollbar-width: none; /* Hide scrollbar for Firefox */
}

@keyframes pulse {
  0% {
    border-color: #e69500;
  }
  50% {
    border-color: transparent;
  }
  100% {
    border-color: #e69500;
  }
}

#speed-text span {
  border-left: solid 1px transparent; /* Add a transparent right border to all characters */
  color: #d5ddd7;
  position: relative;
  font-weight: 400;
  transition: background-color 1s ease;
  line-height: 30px; /* *NOTE* important to have aligned with scroll funtion */
}

.chevron {
  position: absolute;
  top: 1px;
  left: 0px;
  height: 28px;
  width: 2px;
  background-color: #e69500;
  z-index: 1000;
  transition: top 0.1s ease, left 0.1s ease;
}

.line-wrapper {
  position: relative; /* aligns cursor box with text box*/
}

/* formatting for hidden input for mobile devices */
.hidden-input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  pointer-events: none;
}
</style>

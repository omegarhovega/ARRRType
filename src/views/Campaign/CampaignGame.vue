<!--
CampaignGame
- Logic for playing levels in the campaign
- Registers coin wins, rank improvements and which levels are (un)locked
-->

<template>
  <!-- for mobile keyboard -->
  <input
    ref="hiddenInput"
    class="hidden-input"
    id="hiddeninput"
  />
  <div id="root">
    <div
      v-if="!isLevelLocked"
      id="container"
      class="fixed left-0 w-full z-50"
      :style="containerStyle"
    >
      <!-- opponent mugshot and speech bubble-->
      <div class="opponent-wrapper">
        <!-- Opponent mugshot -->
        <img
          :src="mugshotImagePath"
          alt="Mugshot"
          class="mugshot"
        />

        <!-- Speech container -->
        <div
          v-if="showTaunt"
          class="speech-container"
        >
          <div class="pixelated-bubble">
            <div class="speech-text">{{ randomTaunt }}</div>
            <div class="speech-triangle"></div>
          </div>
        </div>
      </div>

      <!-- Player Progress Bar -->
      <PlayerProgress
        :progress="currentProgress"
        :loading="loading"
      />
      <!-- Opponent Progress Bar -->
      <OpponentProgress
        :opponents="opponentsData"
        :loading="loading"
      />
      <div
        v-if="!loading"
        class="w-2/3 mx-auto line-wrapper"
      >
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
    <div v-if="isLevelLocked">
      <div class="locked">
        <div class="locked-container">
          <p>Level is not unlocked yet</p>
          <button @click="goBackToCampaign">
            <div class="shortcut-key">B</div>
            Go Back
          </button>
        </div>
      </div>
    </div>
    <!-- Game statistics overlay after game end -->
    <GameStatsCampaign
      :showResultsOverlay="showResultsOverlay"
      :isFinished="isFinished"
      :levelFinished="levelFinished"
      :resultMessage="resultMessage"
      :wpm="wpm"
      :livesPlayer="livesPlayer"
      :livesOpponent="livesOpponent"
      :opponentWpmLevel="opponentWpmLevel"
      :grossWpm="grossWpm"
      :accuracy="accuracy"
      :timeDifference="timeDifference"
      :totalKeystrokes="totalKeystrokes"
      :displayAccuracyWarning="displayAccuracyWarning"
      :handleNextRoundClick="handleNextRoundClick"
      :backToOverview="backToOverview"
      :handleKeyPress="handleOverlayKeyPress"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  onBeforeUnmount,
} from "vue";
import type { Ref, ComponentPublicInstance } from "vue";
import { useStore } from "../../stores/store";
import { useOpponentLogic } from "../../components/GameLogic/OpponentLogic";
import { useTypingTextHandler } from "../../components/TextLogic/TypingTextHandler";
import { useCountdownLogic } from "../../components/GameLogic/CountdownLogic";
import { useGameStateManagement } from "../../components/GameLogic/GameStateManagement";
import { useUtilities } from "../../components/OtherUtilities/Utilities";
import {
  getResultMessageCampaign,
  maxRounds,
  updateLivesAfterRound,
  handleGameProgress,
  handleLevelWin,
  resetGameStateForNewRound,
  handleNextRound,
} from "../../components/Modes/CampaignLogic";
import {
  OPPONENT_WPM,
  PIRATE_TAUNTS,
} from "../../components/GameLogic/GameConstants";
import { useUserStatistics } from "../../components/StatsHandler/UserStatisticsWrapper";
import { useRouter, useRoute } from "vue-router";
import PlayerProgress from "../../components/GameItems/PlayerProgress.vue";
import OpponentProgress from "../../components/GameItems/OpponentProgress.vue";
import GameTextDisplay from "../../components/GameItems/GameTextDisplay.vue";
import CountdownTimer from "../../components/GameItems/CountdownTimer.vue";
import OverlayMessages from "../../components/GameItems/OverlayMessages.vue";
import GameStatsCampaign from "../../components/GameItems/GameStatsCampaign.vue";
import Chevron from "../../components/TextLogic/Chevron";

export default defineComponent({
  components: {
    PlayerProgress,
    OpponentProgress,
    GameTextDisplay,
    CountdownTimer,
    OverlayMessages,
    GameStatsCampaign,
  },
  setup() {
    // Pinia store
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    // Determines user
    const userSession = computed(() => store.userSession);

    // Variables
    // Fetch selectedLevel from route params
    const selectedLevelFromRoute = Number(route.params.levelNumber); // deduces level number from address/route
    const selectedLevel = computed(() => store.selectedLevel);
    const levels = computed(() => store.levels);
    const levelFinished = ref(false);
    const actualSelectedLevel = computed(() => {
      return selectedLevelFromRoute || store.selectedLevel || 0; // fallback to 0 if all else fails
    });

    // check if mobile device
    const hiddenInput = ref<HTMLElement | null>(null);
    function isMobileDevice() {
      const userAgent = navigator.userAgent;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    }

    // taunts speech bubble interval reference
    let tauntIntervalId: any = null;

    // Refs
    const scrollContainer = ref<HTMLElement | null>(null);
    const gameJustEnded = ref(false);
    const showResultsOverlay = ref(false);
    const chevronTop: Ref<number> = ref(0);
    const chevronLeft: Ref<number> = ref(0);
    const charSpans: Ref<(Element | ComponentPublicInstance)[]> = ref([]); // span elements for each character in the DOM to establish pixel position
    const opponentStarted = ref(false);

    // Computed from Pinia store
    const typed = computed(() => store.typed);
    const typedIndices = computed(() => store.typedIndices);
    const isCapsLockOn = computed(() => store.isCapsLockOn);
    const loading = computed(() => store.loading);
    const errors = computed(() => store.errors);
    const currentIndex = computed(() => store.currentIndex);
    const totalKeystrokes = computed(() => store.totalKeystrokes);
    const userCoins = computed(() => store.userCoins);
    const livesPlayer = computed(() => store.playerLives);
    const livesOpponent = computed(() => store.opponentLives);
    const currentIndexWatcher = computed(() => store.currentIndex);
    const isFinished = computed(() => store.endTime !== null);

    //Computed
    const opponentWpmLevel = computed(() => {
      // Access the reactive value using .value
      const level = actualSelectedLevel.value;

      // Check for null or undefined
      if (level !== null && level !== undefined) {
        return OPPONENT_WPM[level]; // Access the array only when level is not null or undefined
      }

      return 0; // Default value if level is null or undefined *NOTE*
    });

    const displayAccuracyWarning = computed(() => {
      return accuracy.value <= 50;
    });

    // Compute currentProgress
    const currentProgress = computed(() => {
      // Access uniqueCorrectIndices from the store
      const uniqueCorrectIndices = store.uniqueCorrectIndices;
      // Count the number of true values in uniqueCorrectIndices
      const correctCount = uniqueCorrectIndices.reduce(
        (acc, cur) => acc + (cur ? 1 : 0),
        0
      );
      // Calculate the current progress
      return (correctCount / uniqueCorrectIndices.length) * 100; // This will be in percentage
    });

    const opponentsData = computed(() => {
      return [
        {
          id: "1",
          name: "Opponent", // Replace with actual name if available
          progress: opponentProgress.value || 0,
        },
      ];
    });

    const mugshotImagePath = computed(() => {
      const level = actualSelectedLevel.value || 0;
      if (level >= 1 && level <= 15) {
        return `/avatars/Head${level}.webp`; // Construct the image path based on the level
      }
      return "/avatar.webp"; // A default image if the level is out of range
    });

    // Function to generate a random taunt text
    const generateRandomTaunt = () => {
      const randomIndex = Math.floor(Math.random() * PIRATE_TAUNTS.length);
      return PIRATE_TAUNTS[randomIndex];
    };
    const showTaunt = ref(true);
    const randomTaunt = ref(generateRandomTaunt());
    const updateRandomTaunt = () => {
      if (!isFinished.value) {
        // Generate random taunt regardless of game state
        randomTaunt.value = generateRandomTaunt();
        showTaunt.value = true;

        // Set a timer to clear the taunt text after 5 seconds
        setTimeout(clearTaunt, 5000);
      } else {
        showTaunt.value = false;
      }
    };

    const clearTaunt = () => {
      randomTaunt.value = ""; // Clear the taunt text
      showTaunt.value = false;
    };

    const updateCharSpans = () => {
      // Ensure this runs after the DOM updates
      nextTick(() => {
        const spans = document.querySelectorAll("#speed-text span");
        charSpans.value = Array.from(spans);
      });
    };

    const isLevelLocked = computed(() => {
      const lastUnlockedLevel = store.lastUnlockedLevel;
      return actualSelectedLevel.value > lastUnlockedLevel;
    });

    const goBackToCampaign = () => {
      router.push("/Campaign");
    };

    // Import general utility functions
    const { useTextManagement, useTimeDifference, saveTotalTimePlayed } =
      useUtilities();

    // variable to establish current character at current index
    const currentChar = computed(() =>
      fetchedText.value.charAt(store.currentIndex)
    );

    // formatting for overlay boxes at end of rounds
    const containerStyle = computed(() => ({
      filter: showResultsOverlay.value ? "blur(5px)" : "none",
    }));

    // ----------
    // Game Logic
    // ----------
    // ----------------------
    // 1. Load Necessary Data
    // ----------------------
    // load text from database ("text" mode for campaign)
    const { fetchedText, chars, fetchText } = useTextManagement("text");

    // ------------------
    // 2. Start Countdown
    // ------------------
    // key function to trigger game start -> called in onMounted()
    const {
      countdown,
      countdownFinished,
      showCountdown,
      stopCountdown,
      countdownStart,
    } = useCountdownLogic(() => {
      // Actions to perform when the countdown ends:
      startGame(); // startGame method includes setting start time and allows typing
      startOpponentProgress();
      startWpmTracking();
      startIndexTracking();
      // Update the taunt text initially
      updateRandomTaunt();
      // Update the taunt text every 10 seconds
      tauntIntervalId = setInterval(updateRandomTaunt, 10000);
      window.removeEventListener("keydown", handleKeyDown); // Remove previous stale keydown listener if any
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

    const timeDifference = useTimeDifference();

    // --------------------------------------------
    // 4. Handle Game Inputs, Formatting, Scrolling
    // --------------------------------------------
    // Opponent Logic
    // When opponent finishes first, execute endGame logic
    // When opponent settings are changed, execute resetGame logic

    const {
      startOpponentProgress,
      opponentProgress,
      stopOpponentProgress,
      resetOpponentProgress,
    } = useOpponentLogic(fetchedText, opponentWpmLevel, async () => {
      handleGameEnd(); // handle case that opponent finishes first
      await gameProgress(); // handleGameProgress at end of level
    });

    // handle user inputs
    const {
      accuracy,
      totalOccurrences,
      mistakesMade,
      hasMistake,
      removeKeyDownListener,
      detectCapsLock,
      handleKeyDown,
      typeChar,
      startIndexTracking,
      stopIndexTracking,
      resetHasMistake,
    } = useTypingTextHandler(
      fetchedText,
      scrollContainer,
      async () => {
        handleGameEnd(); // handle case that player finishes first
        await gameProgress(); // handleGameProgress between rounds
      },
      currentChar
    );

    // watch position of current character in DOM for chevron positioning
    Chevron.useChevronAnimation(charSpans, chevronTop, chevronLeft);

    // --------------------
    // 5. Handle Statistics
    // --------------------
    // Logging user statistics
    // importing functionality for stats, tracking, measurement, saving, update and reset
    const {
      wpm,
      grossWpm,
      resetStats,
      updateStats,
      saveStats,
      startWpmTracking,
      stopWpmTracking,
      wpmPerSecond,
      grossWpmPerSecond,
      consistencyForStat,
      saveGameStatistics,
    } = useUserStatistics();

    const resultMessage = getResultMessageCampaign(
      wpm,
      levelFinished,
      opponentWpmLevel
    );

    // ------------
    // 6. On Finish
    // ------------
    // A) Stop Game Logic
    // B) Save Statistics
    // C) Reset All Relevant Game Variables

    function handleGameEnd() {
      // triggers overlay above
      endGame(removeKeyDownListener); // *NOTE* sequence important since some functions check if there is an endTime which is set here
      stopGameActivities(
        stopOpponentProgress,
        stopWpmTracking,
        stopIndexTracking,
        stopCountdown
      );
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
      clearInterval(tauntIntervalId); // important to stop taunt intervall from running on
      saveTotalTimePlayed();
    }

    // reset key values when initiating new round and handle end of level
    const gameProgress = async () => {
      updateLivesAfterRound(wpm.value, opponentWpmLevel);
      await handleGameProgress(
        maxRounds,
        levelFinished,
        showResultsOverlay,
        gameJustEnded,
        actualSelectedLevel.value,
        handleLevelWin,
        ref(store.lastUnlockedLevel),
        levels.value
      );
    };

    // Clickable "next round" button in result overlay at round end, resetting key values
    const handleNextRoundClick = () => {
      Chevron.resetChevronPosition(chevronTop, chevronLeft);
      handleNextRound(
        resetGameStateForNewRound,
        showResultsOverlay,
        fetchText,
        resetGameState,
        countdownStart,
        resetOpponentProgress,
        resetStats
      );
      resetHasMistake();
      // update charSpans from DOM
      updateCharSpans();
    };

    // handling player inputs within results overlay to allow hitting enter for continuing
    const handleOverlayKeyPress = (event: KeyboardEvent) => {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "Level") return;

      // Check if 'B' is pressed and level is locked to go back
      if (event.key === "b" && isLevelLocked.value) {
        goBackToCampaign();
        return;
      }

      // key handles either next round or end of level
      if (event.key !== "1") {
        return;
      }

      if (showResultsOverlay.value) {
        if (levelFinished.value) {
          backToOverview();
        } else {
          Chevron.resetChevronPosition(chevronTop, chevronLeft);
          handleNextRound(
            resetGameStateForNewRound,
            showResultsOverlay,
            fetchText,
            resetGameState,
            countdownStart,
            resetOpponentProgress,
            resetStats
          );
          resetHasMistake();
        }
      }
    };

    // Clickable "back to overview" button in results overlay at level end, resetting key values (incl. lives)
    const backToOverview = () => {
      resetGameStateForNewRound();
      router.push("/Campaign");
    };

    // HANDLING EVENTS -----------------------------------------------------------------------------------------
    onMounted(async () => {
      // check if mobile device
      if (isMobileDevice() && hiddenInput.value) {
        hiddenInput.value.focus();
      }
      // initially fetch last unlocked level for player
      await store.fetchLastUnlockedLevel();
      // Check if the level is not locked and if unlocked, start game (prevents players navigating to later level without having ulocked it)
      if (!isLevelLocked.value) {
        // Existing logic for game initialization
        window.addEventListener("keydown", detectCapsLock);
        window.addEventListener("keyup", detectCapsLock);
        fetchText(store.numberOfWords); // Fetch the initial text
        countdownStart(); // Start the initial countdown
      }
      window.addEventListener("keydown", handleOverlayKeyPress);
    });

    // Fail-save to allow stopping games with abrupt unmountings
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
      // Clean up event listeners
      stopGameActivities(
        stopOpponentProgress,
        stopWpmTracking,
        stopIndexTracking,
        stopCountdown
      );
      resetGameActivities(
        resetOpponentProgress,
        resetGameState, // from GameStateManagement
        resetStats // from UserStatistics
      );
      resetHasMistake();
      // reset values for campaign separately
      store.playerLives = 2;
      store.opponentLives = 2;
      store.currentRound = 1;
      // Remove keydown event listeners
      removeKeyDownListener();
      // Reset loaded text
      fetchedText.value = "";
      sessionStorage.removeItem("isRefreshed");
      window.removeEventListener("keydown", handleOverlayKeyPress);
    });

    return {
      chars,
      containerStyle,
      isCapsLockOn,
      loading,
      showCountdown,
      countdown,
      countdownFinished,
      currentIndex,
      typedIndices,
      typed,
      fetchedText,
      opponentProgress,
      showResultsOverlay,
      resultMessage,
      wpm,
      grossWpm,
      totalKeystrokes,
      accuracy,
      levelFinished,
      opponentStarted,
      scrollContainer,
      opponentWpmLevel,
      userCoins,
      currentChar,
      userSession,
      selectedLevel,
      levels,
      displayAccuracyWarning,
      livesPlayer,
      livesOpponent,
      currentProgress,
      typeChar,
      handleOverlayKeyPress,
      handleNextRoundClick,
      handleNextRound,
      handleGameProgress,
      backToOverview,
      countdownStart,
      handleKeyDown,
      fetchText,
      updateStats,
      saveStats,
      detectCapsLock,
      charSpans,
      chevronTop,
      chevronLeft,
      timeDifference,
      isLevelLocked,
      goBackToCampaign,
      opponentsData,
      currentIndexWatcher,
      hasMistake,
      isFinished,
      mugshotImagePath,
      hiddenInput,
      randomTaunt,
      showTaunt,
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

#countdown,
#countdown-placeholder,
#wpm-stat,
#wpm-placeholder {
  text-align: left;
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

#speed-text {
  white-space: normal;
  text-align: justify;
  overflow-wrap: break-word;
  height: 90px;
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
  border-left: solid 1px transparent; /* Add a transparent right border to all characters where chevron has space */
  color: #d5ddd7;
  position: relative;
  font-weight: 400;
  transition: background-color 1s ease;
  line-height: 30px;
}

.chevron {
  position: absolute;
  top: 1px;
  left: 0px;
  height: 28px;
  width: 2px;
  background-color: #e69500;
  z-index: 1000; /* Ensure it's above the text but below other overlays */
  transition: top 0.1s ease, left 0.1s ease;
}

.line-wrapper {
  position: relative; /* aligns cursor box with text box*/
}

.locked {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  flex-wrap: wrap;
  gap: 10px;
}

.locked-container {
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centers items horizontally in the mode-boxes-container */
  flex-wrap: wrap;
  gap: 10px;
  height: 100px;
  position: relative;
  text-align: center;
  cursor: pointer;
}

.locked-container button {
  position: relative;
}

.shortcut-key {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
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

.mugshot {
  width: 100px;
  height: 100px;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  pointer-events: none;
}

.opponent-wrapper {
  display: flex;
  align-items: center;
  position: relative; /* Set position to relative for absolute positioning of speech container */
}

.speech-container {
  position: absolute;
  top: 0;
  left: 100px;
}

.speech-text {
  font-family: "Arial", sans-serif;
  color: #000000;
  line-height: 1.2;
}

.speech-triangle {
  position: absolute;
  top: 50%;
  left: -8px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #ffffff;
  transform: translateY(-50%);
}

.pixelated-bubble {
  background-color: #ffffff;
  border: 2px solid #000000;
  border-radius: 10px;
  padding: 10px;
  min-width: 200px;
  max-width: 300px;
  text-align: center;
  font-size: 14px;
}
</style>

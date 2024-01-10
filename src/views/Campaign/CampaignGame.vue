<!--
CampaignGame
Using Composition API
- Logic for playing levels in the campaign and progressing through campaign
- Registers coin wins and which levels are (un)locked
Using Vue Composition API *NOTE* Group code appropriately and see if Composition API makes sense everywhere (should be used only for longer more complex components)

Bugs:
- Levels are not saved correctly: When logged in they should be saved to database and when locked out just from local storage (resets when deleting cache or logging in)
- Opponent once randomly started after first 4 or 5 characters, could not reproduce (might be related to opponent progress logic - should always start at 0)
-->

<!-- *********** HTML **************** -->

<template>
  <!-- for mobile keyboard -->
  <input
    ref="hiddenInput"
    class="hidden-input"
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
      <!-- Countdown -->
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
            <div class="shortcut-key">B</div> <!-- Moved inside the button -->
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
      :handleKeyPress="handleKeyPress"
    />
  </div>
</template>


<!-- *********** JAVA SCRIPT **************** -->

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
import { useOpponentLogic } from "../../components/OpponentLogic";
import { useTypingTextHandler } from "../../components/TypingTextHandler"; // Import the typing text handler
import { useCountdownLogic } from "../../components/CountdownLogic";
import { useGameStateManagement } from "../../components/GameStateManagement"; // Import the game state management logic
import { useUtilities } from "../../components/Utilities";
import {
  getResultMessageCampaign,
  maxRounds,
  updateLivesAfterRound,
  handleGameProgress,
  handleLevelWin,
  resetGameStateForNewRound,
  handleNextRound,
} from "../../components/CampaignLogic";
import { OPPONENT_WPM, PIRATE_TAUNTS } from "../../components/GameConstants";
import { useUserStatistics } from "../../components/UserStatistics";
import { useRouter, useRoute } from "vue-router";
import PlayerProgress from "../../components/GameItems/PlayerProgress.vue";
import OpponentProgress from "../../components/GameItems/OpponentProgress.vue";
import GameTextDisplay from "../../components/GameItems/GameTextDisplay.vue";
import CountdownTimer from "../../components/GameItems/CountdownTimer.vue";
import OverlayMessages from "../../components/GameItems/OverlayMessages.vue";
import GameStatsCampaign from "../../components/GameItems/GameStatsCampaign.vue";

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
    const selectedLevel = computed(() => store.selectedLevel); // <-- Add this line
    const levels = computed(() => store.levels);
    const levelFinished = ref(false);

    const actualSelectedLevel = computed(() => {
      return selectedLevelFromRoute || store.selectedLevel || 0; // fallback to 0 if all else fails
    });

    const mugshotImagePath = computed(() => {
      console.log("Selected Level,", actualSelectedLevel.value);
      const level = actualSelectedLevel.value || 0; // Fetch the selected level from the store
      if (level >= 1 && level <= 15) {
        return `/avatars/Head${level}.png`; // Construct the image path based on the level
      }
      return "/avatar.png"; // A default image if the level is out of range
    });

    // check if mobile device
    const hiddenInput = ref<HTMLElement | null>(null);

    function isMobileDevice() {
      const userAgent = navigator.userAgent;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    }

    // logic for handling player inputs, determine correct and incorrect inputs, statistics, scrolling for longer texts (TypingTextHandler)
    const scrollContainer = ref<HTMLElement | null>(null);
    const gameJustEnded = ref(false);
    const showResultsOverlay = ref(false);

    // Refs
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

    // Function to generate a random taunt text
    const generateRandomTaunt = () => {
      const randomIndex = Math.floor(Math.random() * PIRATE_TAUNTS.length);
      return PIRATE_TAUNTS[randomIndex];
    };

    // In your Vue component setup
    const showTaunt = ref(true);
    const randomTaunt = ref(generateRandomTaunt());

    // Function to update the random taunt text
    // Function to update the random taunt text
    const updateRandomTaunt = () => {
      // Generate random taunt regardless of game state
      randomTaunt.value = generateRandomTaunt();

      // Show taunt only if the game is not finished
      if (!isFinished) {
        showTaunt.value = true;

        // Set a timer to clear the taunt text after 5 seconds
        setTimeout(clearTaunt, 5000); // 5000 milliseconds (5 seconds)
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
      const lastUnlockedLevel = store.lastUnlockedLevel; // Assuming this value is stored in your Pinia store
      return actualSelectedLevel.value > lastUnlockedLevel;
    });

    const goBackToCampaign = () => {
      console.log("Calling goBackToCampaign");
      router.push("/Campaign");
    };

    // Import general utility functions
    const {
      useTextManagement,
      useChevronAnimation,
      resetChevronPosition,
      useTimeDifference,
      saveTotalTimePlayed,
    } = useUtilities();

    // variable to establish current character at current index (*NOTE* could be centralised)
    const currentChar = computed(() =>
      fetchedText.value.charAt(store.currentIndex)
    );

    // formatting for overlay boxes at end of rounds (*NOTE* could be centralised)
    const containerStyle = computed(() => ({
      filter: showResultsOverlay.value ? "blur(5px)" : "none",
    }));

    // ----------
    // Game Logic
    // ----------
    // ----------------------
    // 1. Load Necessary Data
    // ----------------------
    // load text from database
    const { fetchedText, chars, fetchText } = useTextManagement("text"); //pulls texts only for campaign

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
      window.removeEventListener("keydown", handleKeyDown); // Remove previous keydown listener if any
      window.addEventListener("keydown", handleKeyDown); // Add new keydown listener
    });

    //--------------
    // 3. Start Game
    // -------------
    // *NOTE* add startGameLogic() function to group relevant functions
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

    // handle inputs
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
    useChevronAnimation(charSpans, chevronTop, chevronLeft);

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
    // *NOTE* removed watcher for endTime and handle gameEnd through flow alone

    function handleGameEnd() {
      console.log("Calling handleGameEnd");
      // triggers overlay above
      endGame(removeKeyDownListener); // *NOTE* sequence important since some functions check of there is an endTime which is set here
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
        totalOccurrences,
        mistakesMade,
        consistencyForStat,
        updateStats,
        saveStats
      );
      saveTotalTimePlayed();
      console.log(
        "Time and Levels played Campaign Game",
        store.totalTimePlayed,
        store.numberOfGamesPlayed
      );
    }

    // reset key values when initiating new round and handle end of level
    const gameProgress = async () => {
      console.log(
        "Before updating lives:",
        livesPlayer.value,
        livesOpponent.value
      );
      updateLivesAfterRound(wpm.value, opponentWpmLevel);
      console.log(
        "After updating lives:",
        livesPlayer.value,
        livesOpponent.value
      );
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
      console.log(
        "Store state before updating lives:",
        JSON.stringify(store.$state)
      );
    };

    // Clickable "next round" button in result overlay at round end, resetting key values
    // *NOTE* needs to be the same as end round logic when pressing enter (should combine?)
    const handleNextRoundClick = () => {
      console.log("handleNextRoundClick Triggered");
      resetChevronPosition(chevronTop, chevronLeft);
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

    console.log("Selected Level (outside method):", selectedLevel);

    // handling player inputs within results overlay to allow hitting enter for continuing (*NOTE* could be centralised)
    // handling player inputs within results overlay to allow hitting enter for continuing
    const handleKeyPress = (event: KeyboardEvent) => {
      console.log("Calling handleKeyPress overlay");

      // Check if 'B' is pressed and level is locked
      if (event.key === "b" && isLevelLocked.value) {
        goBackToCampaign();
        return;
      }

      // Existing logic for 'Enter' key
      if (event.key !== "Enter") {
        return;
      }
      console.log("Enter key pressed");

      if (showResultsOverlay.value) {
        if (levelFinished.value) {
          backToOverview();
        } else {
          resetChevronPosition(chevronTop, chevronLeft);
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
      console.log("backToOverview Triggered");
      console.log("Level Finished:", levelFinished.value);
      console.log("Show Results Overlay:", showResultsOverlay.value);
      resetGameStateForNewRound();
      //emit("returnToOverview");
      router.push("/Campaign");
    };

    // HANDLING EVENTS -----------------------------------------------------------------------------------------
    onMounted(async () => {
      // check if mobile device
      if (isMobileDevice() && hiddenInput.value) {
        hiddenInput.value.focus();
      }
      console.log("Component Mounted");
      await store.fetchLastUnlockedLevel();
      window.addEventListener("keyup", handleKeyPress);
      if (!isLevelLocked.value) {
        // Check if the level is not locked
        // Existing logic for game initialization
        window.addEventListener("keydown", detectCapsLock);
        window.addEventListener("keyup", detectCapsLock);
        fetchText(store.numberOfWords); // Fetch the initial text
        countdownStart(); // Start the initial countdown
        console.log("Selected level on mount:", selectedLevel.value);
        console.log("Actual selected level on mount:", actualSelectedLevel);
      }
      // Update the taunt text initially
      updateRandomTaunt();
      // Update the taunt text every 10 seconds
      setInterval(updateRandomTaunt, 10000);
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
      window.removeEventListener("keyup", handleKeyPress);

      // Ensure all game state is reset or saved
      resetGameState();
    });

    onUnmounted(() => {
      // Clean up event listeners
      console.log("Component Unmounted");
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
        resetStats // from UserStatistics, *NOTE* prevent from removing local storage data that needs to be kept *NOTE* check slow words
      );
      resetHasMistake();
      // reset values for campaign separately
      store.playerLives = 2;
      store.opponentLives = 2;
      store.currentRound = 1;
      console.log("Current on unmount playerLives:", store.playerLives);
      console.log("Currenton on unmount playerLives:", store.opponentLives);
      console.log("Current on unmount round:", store.currentRound);
      // Remove keydown event listeners
      removeKeyDownListener();
      window.removeEventListener("keyup", handleKeyPress);
      // Reset loaded text
      fetchedText.value = "";
      sessionStorage.removeItem("isRefreshed");
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
      handleKeyPress,
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


<!-- *********** CSS **************** -->

<style scoped>
#container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Adjusted to the height of main menu, min height used so content is not pushed behing main menu on vertical resize */
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

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 10px;
}

#speed-text {
  white-space: normal; /* pre-wrap not used */
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
  border-left: solid 1px transparent; /* Add a transparent right border to all characters */
  color: #d5ddd7;
  position: relative;
  font-weight: 400;
  transition: background-color 1s ease;
  line-height: 30px;
}

#speed-text span.correct {
  color: #d5ddd7;
  opacity: 0.4;
}

#speed-text span.incorrect {
  color: red;
  border-bottom: 2px solid red;
  opacity: 0.25;
}

#speed-text span.incorrectSpace {
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
  position: relative; /* aligns cursor box with text box*/
}

.locked {
  display: flex;
  justify-content: center; /* Centers items horizontally */
  align-items: center; /* Centers items vertically */
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  flex-wrap: wrap; /* Allows items to wrap if needed */
  gap: 10px; /* You can set a gap between the items */
}

.locked-container {
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centers items horizontally in the mode-boxes-container */
  flex-wrap: wrap; /* Allows items to wrap within the mode-boxes-container */
  gap: 10px; /* You can set a gap between the items */
  height: 100px;
  position: relative;
  text-align: center;
  cursor: pointer;
}

.locked-container button {
  position: relative;
}

.training-mode-box {
  position: relative;
  text-align: center;
  cursor: pointer;
  width: 25%; /* Example percentage width - adjust as needed */
  max-width: 300px; /* Control the maximum size */
  padding: 10px;
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

/* Style the speech container */
.opponent-wrapper {
  display: flex;
  align-items: center; /* Center items vertically */
  position: relative; /* Set position to relative for absolute positioning of speech container */
}

.speech-container {
  position: absolute; /* Position the speech container absolutely */
  top: 0; /* Align it to the top of the opponent image */
  left: 100px; /* Adjust this value as needed to control the distance from the image */
}

/* Style the speech bubble */
.speech-bubble {
  background-color: #ffffff;
  border: 2px solid #000000;
  border-radius: 10px;
  padding: 10px;
  top: 5px;
  max-width: 200px;
  text-align: center;
  font-size: 14px;
  position: relative; /* Add relative positioning for child elements */
  margin-left: 10px; /* Add margin to separate from the image */
}

/* Style the speech text */
.speech-text {
  font-family: "Arial", sans-serif;
  color: #000000;
  line-height: 1.2;
}

/* Style the speech triangle */
.speech-triangle {
  position: absolute;
  top: 50%; /* Position it in the middle vertically */
  left: -8px; /* Position it to the right of the speech bubble */
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #ffffff;
  transform: translateY(-50%); /* Center it vertically */
}

.pixelated-bubble {
  background-color: #ffffff; /* Set the background color of the bubble */
  border: 2px solid #000000; /* Set the border color and thickness */
  border-radius: 10px; /* Adjust the border radius for a rounded appearance */
  padding: 10px; /* Adjust the padding as needed */
  min-width: 200px;
  max-width: 300px;
  text-align: center;
  font-size: 14px; /* Adjust the font size as needed */
}
</style>

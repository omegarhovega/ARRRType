<!--
Online Game
- Player vs. Player game using supabase realtime functionality
-->
<template>
  <!-- for mobile keyboard -->
  <input
    ref="hiddenInput"
    class="hidden-input"
  />
  <div id="root">
    <!-- Container has z-index 50 set -->
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
      <!-- Opponent Progress Bar -->
      <OpponentProgress
        :opponents="opponentsData"
        :loading="loading"
      />
      <div
        v-if="!loading"
        class="w-2/3 mx-auto line-wrapper"
      >
        <!-- Chevron -->
        <div
          class="chevron"
          :style="{ top: `${chevronTop}px`, left: `${chevronLeft}px` }"
        ></div>

        <!-- Scroll container -->
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
    <GameStats
      :isFinished="isFinished"
      :resultMessage="resultMessage"
      :playerWon="playerWon"
      :wpm="wpm"
      :grossWpm="grossWpm"
      :accuracy="accuracy"
      :timeDifference="timeDifference"
      :totalKeystrokes="totalKeystrokes"
      :displayAccuracyWarning="displayAccuracyWarning"
      :navigateToCampaign="navigateToCampaign"
      :navigateToUserStats="navigateToUserStats"
    />
    <!-- Latency box -->
    <div id="latency-box">
      Latency: <span>{{ latency.toFixed(0) }}ms</span>
    </div>
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
  onBeforeUnmount,
} from "vue";
import type { Ref, ComponentPublicInstance } from "vue";
import { useStore } from "../../stores/store";
import { useTypingTextHandler } from "../../components/TextLogic/TypingTextHandler";
import { useUtilities } from "../../components/OtherUtilities/Utilities";
import {
  grossWpmPerSecond,
  useUserStatistics,
} from "../../components/StatsHandler/UserStatisticsWrapper";
import {
  useMultiplayerTextManagement,
  useMultiplayerGameStateManagement,
  useMultiplayerCountdownLogic,
  handlePvPLevelWin,
} from "../../components/Modes/Multiplayer";
import { useMultiplayerRealtime } from "../../components/Modes/MultiplayerRealtime";
import { useRouter } from "vue-router";
import { supabase } from "../../supabase";
import PlayerProgress from "../../components/GameItems/PlayerProgress.vue";
import OpponentProgress from "../../components/GameItems/OpponentProgress.vue";
import GameTextDisplay from "../../components/GameItems/GameTextDisplay.vue";
import CountdownTimer from "../../components/GameItems/CountdownTimer.vue";
import GameStats from "../../components/GameItems/GameStats.vue";
import OverlayMessages from "../../components/GameItems/OverlayMessages.vue";
import Chevron from "../../components/TextLogic/Chevron";

export default defineComponent({
  props: ["gameId"],
  components: {
    PlayerProgress,
    OpponentProgress,
    GameTextDisplay,
    CountdownTimer,
    GameStats,
    OverlayMessages,
  },
  setup() {
    // -----------------------------------
    // Variables and general functionality
    // -----------------------------------
    //Router inititalisation
    const router = useRouter();

    // Pinia store
    const store = useStore();

    // Supabase channel and gameId, startTime, playerStatuses
    const gameId = computed(() => store.gameId);
    const playerID = store.playerID;
    const startTime: Ref<Date | null> = ref(null);
    const playerStatuses = ref<Record<string, boolean>>({});

    // Refs
    const chevronTop: Ref<number> = ref(0);
    const chevronLeft: Ref<number> = ref(0);
    const charSpans: Ref<(Element | ComponentPublicInstance)[]> = ref([]);
    const scrollContainer = ref<HTMLElement | null>(null);
    const tooltipTimeoutId = ref<number | null>(null);
    const countdownInterval = ref<number | null>(null);
    const chars: Ref<string[]> = ref([]);
    const noEndWithoutCorrection: Ref<boolean> = ref(true);
    const resultMessage: Ref<string> = ref("");
    const playerWon: Ref<boolean> = ref(false);
    const progressBarRef = ref<HTMLElement | null>(null);
    const roundTripLatency: Ref<number> = ref(0);

    // Computed from Pinia Storage
    const totalKeystrokes = computed(() => store.totalKeystrokes);
    const correctKeystrokes = computed(() => store.correctKeystrokes);
    const currentChar = computed(() =>
      fetchedText.value.charAt(store.currentIndex)
    );
    const isFinished = computed(() => store.endTime !== null);
    const typed = computed(() => store.typed);
    const typedIndices = computed(() => store.typedIndices);
    const isCapsLockOn = computed(() => store.isCapsLockOn);
    const loading = computed(() => store.loading);
    const startTyping = computed(() => store.startTyping);
    const errors = computed(() => store.errors);
    const currentIndexWatcher = computed(() => store.currentIndex);

    // Computed other
    const opponentsData = computed(() => {
      return filteredOpponents.value.map((opponentId) => ({
        id: opponentId,
        name: "Opponent", // Replace with actual name
        progress: opponentProgresses[opponentId] || 0,
      }));
    });

    // indicate in end of game overlay when results are not saved due to accuracy being 50% or below
    const displayAccuracyWarning = computed(() => {
      return accuracy.value <= 50;
    });

    // blur background while results tooltip is overlayed
    const containerStyle = computed(() => ({
      filter: isFinished.value ? "blur(5px)" : "none",
    }));

    // Compute currentProgress
    const currentProgress = computed(() => {
      const uniqueCorrectIndices = store.uniqueCorrectIndices;
      // Count the number of true values in uniqueCorrectIndices
      const correctCount = uniqueCorrectIndices.reduce(
        (acc, cur) => acc + (cur ? 1 : 0),
        0
      );
      // Calculate the current progress as percentage
      return (correctCount / uniqueCorrectIndices.length) * 100;
    });

    // check if mobile device
    const hiddenInput = ref<HTMLElement | null>(null);

    function isMobileDevice() {
      const userAgent = navigator.userAgent;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    }

    // Calcularte icon position at end of oppenent progress bar
    const shipPosition: Ref<number> = ref(0);
    const progressBarWidth = progressBarRef.value?.offsetWidth || 0;
    shipPosition.value = (currentProgress.value / 100) * progressBarWidth;

    // Exclude 0 values from opponents
    const filteredOpponents = computed(() => {
      return opponents.value.filter(
        (opponent) => opponent !== null && opponent !== undefined
      );
    });

    // Import general utility functions
    const { useTimeDifference, saveTotalTimePlayed } = useUtilities();

    // formatting time for display in overlay at game end
    const timeDifference = useTimeDifference();

    // ----------
    // Game Logic
    // ----------
    // ----------------------
    // 1. Load Necessary Data
    // ----------------------
    // load text from database depending on training mode -> called in onMounted()
    const { fetchedText, fetchMultiplayerText } =
      useMultiplayerTextManagement();

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
    } = useMultiplayerCountdownLogic(() => {
      // Actions to perform when the countdown ends:
      startGame(); // startGame method includes setting start time and allows typing
      startWpmTracking(); // used to measure Wpm per second tracking
      startIndexTracking(); // used to measure which word is currently typed
      window.removeEventListener("keydown", handleKeyDown); // Remove any stale previous keydown listener if any
      window.addEventListener("keydown", handleKeyDown); // Add new keydown listener
      sessionStorage.setItem("gameInProgress", "true"); // indicate that game is in progress
    }, startTime.value);

    //--------------
    // 3. Start Game
    // -------------
    const {
      startGame,
      endGame,
      resetGameState,
      stopGameActivities,
      resetGameActivities,
    } = useMultiplayerGameStateManagement();

    // --------------------------------------------
    // 4. Handle Game Inputs, Formatting, Scrolling
    // --------------------------------------------

    // Handle user inputs
    // Main functionality for dealing with typed inputs during game runtime
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
    } = useTypingTextHandler(
      fetchedText,
      scrollContainer,
      () => {
        handleGameEnd(); // handle case player finishes first
      },
      currentChar,
      currentProgress,
      noEndWithoutCorrection
    );

    // *NOTE* since the PvP game cannot be refreshed (player will exit at refresh), there is no separate updateCharSpans function like in the Training or Computer Campaign modes
    Chevron.useChevronAnimation(charSpans, chevronTop, chevronLeft);

    // --------------------
    // 5. Handle Statistics
    // --------------------
    // Logging user statistics
    // importing functionality for stats, tracking, measurement, saving, update and reset
    const {
      wpm,
      grossWpm,
      consistencyForStat,
      wpmPerSecond,
      resetStats,
      updateStats,
      saveStats,
      startWpmTracking,
      stopWpmTracking,
      calculateConsistency,
      saveGameStatistics,
    } = useUserStatistics();

    // ------------
    // 6. On Finish
    // ------------
    // A) Stop Game Logic
    // B) Save Statistics
    // C) Reset All Relevant Game Variables

    function handleGameEnd() {
      // triggers overlay above
      endGame(removeKeyDownListener); // *NOTE* sequence important since some functions check of there is an endTime which is set here
      stopGameActivities(stopWpmTracking, stopIndexTracking, stopCountdown);
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
      saveTotalTimePlayed();
      console.log(
        "Time and Levels played OnlineGame",
        store.totalTimePlayed,
        store.numberOfGamesPlayed
      );
    }

    // End of game overlay key press logic
    function handleOverlayKeyPress(event: KeyboardEvent) {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "OnlineGame") return;

      if (isFinished.value) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
          return;
        }
        switch (event.key.toUpperCase()) {
          case "1":
            navigateToCampaign();
            break;
          case "2":
            navigateToUserStats();
            break;
        }
      }
    }
    function navigateToCampaign() {
      router.push({ name: "CampaignMode" });
    }
    function navigateToUserStats() {
      router.push({ name: "LastRoundStats" });
    }

    // multiplayer logic using supabase realtime channels
    const {
      broadcastProgress,
      setupMultiplayerGame,
      cleanup,
      opponents,
      opponentProgresses,
      latency,
    } = useMultiplayerRealtime(
      gameId,
      playerID,
      resultMessage,
      playerWon,
      handlePvPLevelWin,
      startTime,
      countdownStart,
      roundTripLatency
    );

    // Watch for changes in user's current progress and broadcast them to other players
    let previousProgress = currentProgress.value;

    watch(currentProgress, (newProgress) => {
      broadcastProgress(newProgress, previousProgress);
      previousProgress = newProgress; // Update the previous progress
    });

    //-----------
    // Life Cycle
    //-----------

    onMounted(async () => {
      // CHECK WHETHER PLAYER ALLOWED TO JOIN------------------------------------
      if (!gameId.value) {
        // In case of incorrect gameID redirect to CampaignMode page
        router.replace({ name: "CampaignMode" });
        return;
      }
      // check if mobile device
      if (isMobileDevice() && hiddenInput.value) {
        hiddenInput.value.focus();
      }
      // Fetch player statuses and check if player is active
      const { data: gameDataStatus, error: gameStatusError } = await supabase
        .from("games")
        .select("player_active")
        .eq("id", gameId.value);

      if (gameStatusError) {
        console.error("Error fetching player statuses:", gameStatusError);
      } else if (
        gameDataStatus &&
        gameDataStatus[0] &&
        gameDataStatus[0].player_active != null
      ) {
        // Directly use the player_active status from the database
        playerStatuses.value = gameDataStatus[0].player_active;

        // If the player's status is false, redirect to CampaignMode
        if (!playerStatuses.value) {
          navigateToCampaign();
        }
      }
      // ------------------------------------------------------------------------

      // fetch same text for all players and setup game
      await fetchMultiplayerText(gameId.value);
      setupMultiplayerGame();

      chars.value = fetchedText.value.split("");

      window.addEventListener("keydown", handleOverlayKeyPress);
      // log if Capslock is active
      window.addEventListener("keydown", detectCapsLock);
      window.addEventListener("keyup", detectCapsLock);
    });

    // Fail-save to allow stopping games with abrupt unmountings
    onBeforeUnmount(() => {
      // Clean up all game activities
      stopGameActivities(stopWpmTracking, stopIndexTracking, stopCountdown);
      window.removeEventListener("keydown", handleKeyDown);

      // Ensure all game state is reset or saved
      resetGameState();
    });

    onUnmounted(async () => {
      // Set the player's status to false when leaving the game
      stopGameActivities(stopWpmTracking, stopIndexTracking, stopCountdown);
      resetGameActivities(resetGameState, resetStats);
      removeKeyDownListener();
      fetchedText.value = "";
      window.removeEventListener("keydown", handleOverlayKeyPress);
      sessionStorage.removeItem("gameInProgress");

      // Unsubscribe from channels
      cleanup();
    });

    // *NOTE* check what is needed
    return {
      currentIndexWatcher,
      countdown,
      correctKeystrokes,
      countdownFinished,
      loading,
      fetchedText,
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
      wpm,
      grossWpm,
      resultMessage,
      countdownInterval,
      scrollContainer,
      errors,
      totalKeystrokes,
      charSpans,
      chevronTop,
      chevronLeft,
      timeDifference,
      displayAccuracyWarning,
      gameId,
      startTime,
      playerWon,
      handleOverlayKeyPress,
      countdownStart,
      handleKeyDown,
      deleteLastChar,
      deleteLastWord,
      typeChar,
      detectCapsLock,
      calculateConsistency,
      navigateToUserStats,
      navigateToCampaign,
      currentProgress,
      roundTripLatency,
      shipPosition,
      filteredOpponents,
      opponentProgresses,
      hasMistake,
      latency,
      opponentsData,
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
  white-space: normal; /* pre-wrap not used */
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

#speed-text span {
  border-left: solid 1px transparent; /* Add a transparent right border to all characters */
  color: #d5ddd7;
  position: relative;
  font-weight: 400;
  transition: background-color 1s ease;
  line-height: 30px; /* *NOTE* important to have aligned with scroll funtion */
}

.line-wrapper {
  position: relative; /* aligns cursor box with text box*/
}

#latency-box {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  z-index: 1001;
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

.chevron {
  position: absolute;
  top: 1px;
  left: 0px;
  height: 28px;
  width: 2px; /* Change this to make the line thicker or thinner */
  background-color: #e69500;
  z-index: 1000; /* Ensure it's above the text but below other overlays */
  transition: top 0.08s ease, left 0.08s ease;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  pointer-events: none;
}
</style>
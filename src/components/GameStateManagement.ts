import { useStore } from "../stores/store";

interface GameStateManagement {
    startGame: () => void;
    endGame: (removeKeyDownListener: () => void) => void;
    resetGameState: () => void;
    stopGameActivities: (stopOpponentProgress: Function, stopWpmTracking: Function, stopIndexTracking: Function, stopCountdown: Function) => void;
    resetGameActivities: (resetOpponentProgress: Function, resetGameState: Function, resetStats: Function) => void;
}

export function useGameStateManagement(): GameStateManagement {
    const store = useStore();

    // Function to start the game
    function startGame() {
        console.log("Calling startGame")
        store.isGameStarted = true;
        store.startTime = new Date();
        store.typingAllowed = true;
    }

    // Function to end the game
    function endGame(onFinish: () => void) {
        console.log("Calling endGame")
        store.isGameFinished = true;
        store.endTime = new Date();
        onFinish(); // Call the provided function to finish the game (e.g., remove the keydown event listener)
    }

    // Function to reset the game
    function resetGameState() {
        const store = useStore();
        console.log("Calling resetGameState")
        //store.userStats = []; *NOTE* moved to resetStats, check if correctly cleared
        store.isGameStarted = false;
        store.isGameFinished = false;
        store.startTime = null;
        store.endTime = null;
        store.currentIndex = 0;
        store.loading = true;
        store.startTyping = false;
        store.typed = {};
        store.typedIndices = [];
        store.isCapsLockOn = false; // *NOTE* chose to reset, is turned on again at beginning of a round if CapsLock is still on.
        store.errors = [];
        store.typingAllowed = false;

        console.log("in resetGame isGameStarted:", store.isGameStarted)
        console.log("in resetGame isGameFinished:", store.isGameFinished)
        console.log("in resetGame resetting userStats:", store.userStats)
        console.log("in resetGame currentIndex", store.currentIndex);
        console.log("in resetGame endTime", store.endTime);
        console.log("in resetGame loading", store.loading);
        console.log("in resetGame startTime", store.startTime);
        console.log("in resetGame startTyping", store.startTyping);
        console.log("in resetGame typed", store.typed);
        console.log("in resetGame typedIndices", store.typedIndices);
        console.log("in resetGame isCapsLockOn", store.isCapsLockOn);
        console.log("in resetGame errors", store.errors);
        console.log("in resetGame typingAllowed", store.typingAllowed);
    }

    function stopGameActivities(stopOpponentProgress: Function, stopWpmTracking: Function, stopIndexTracking: Function, stopCountdown: Function) {
        // Stop opponent progress
        stopOpponentProgress();
        // Stop WPM tracking
        stopWpmTracking();
        // Stop index tracking
        stopIndexTracking();
        // stop countdown logic
        stopCountdown();
    }

    function resetGameActivities(resetOpponentProgress: Function, resetGameState: Function, resetStats: Function) {
        console.log("Calling resetGameStateManagement")
        resetOpponentProgress();
        resetGameState(); // from GameStateManagement
        resetStats(); // from UserStatistics, *NOTE* prevent from removing local storage data that needs to be kept
    }

    return {
        startGame,
        endGame,
        resetGameState,
        stopGameActivities,
        resetGameActivities,
    };
}



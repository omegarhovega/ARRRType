import { useStore } from "../stores/store";

interface GameStateManagement {
    startGame: () => void;
    endGame: (removeKeyDownListener: () => void) => void;
    resetGameState: () => void;
    stopGameActivities: (stopOpponentProgress: Function, stopWpmTracking: Function, stopIndexTracking: Function, stopCountdown: Function) => void;
    resetGameActivities: (resetOpponentProgress: Function, resetGameState: Function, resetStats: Function) => void;
}

// used to manage game start, stop and resets variables accordingly
export function useGameStateManagement(): GameStateManagement {
    const store = useStore();

    function startGame() {
        store.isGameStarted = true;
        store.startTime = new Date();
        store.typingAllowed = true;
    }

    function endGame(onFinish: () => void) {
        store.isGameFinished = true;
        store.endTime = new Date();
        onFinish();
    }

    function resetGameState() {
        const store = useStore();
        store.isGameStarted = false;
        store.isGameFinished = false;
        store.startTime = null;
        store.endTime = null;
        store.currentIndex = 0;
        store.loading = true;
        store.startTyping = false;
        store.typed = {};
        store.typedIndices = [];
        store.isCapsLockOn = false;
        store.errors = [];
        store.typingAllowed = false;
    }

    function stopGameActivities(stopOpponentProgress: Function, stopWpmTracking: Function, stopIndexTracking: Function, stopCountdown: Function) {
        stopOpponentProgress();
        stopWpmTracking();
        stopIndexTracking();
        stopCountdown();
    }

    function resetGameActivities(resetOpponentProgress: Function, resetGameState: Function, resetStats: Function) {
        resetOpponentProgress();
        resetGameState();
        resetStats();
    }

    return {
        startGame,
        endGame,
        resetGameState,
        stopGameActivities,
        resetGameActivities,
    };
}



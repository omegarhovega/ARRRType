import { ref } from "vue";
import type { Ref } from "vue";
import { supabase } from "../supabase";
import { useStore } from "../stores/store";
import { DEFAULT_COUNTDOWN_VALUE } from './GameConstants';

// multiplayer text management draws text id from games table in supabase to synchronize for all players
export function useMultiplayerTextManagement() {
    const store = useStore();
    const fetchedText = ref<string>("");

    async function fetchMultiplayerText(gameId: string): Promise<string[]> {
        try {
            // Step 1: Fetch textId based on individual gameId for current game
            const { data: gameData, error: gameError } = await supabase
                .from('games')
                .select('text_id')
                .eq('id', gameId)
                .single();

            if (gameError || !gameData || !gameData.text_id) {
                console.error(`Error fetching game with ID ${gameId}:`, gameError);
                return [];
            }

            const textId = gameData.text_id;

            // Step 2: Fetch text based on textId
            const { data: textData, error: textError } = await supabase
                .from("texts")
                .select("text")
                .eq("id", textId)
                .single();

            if (textError) {
                console.error(`Error fetching multiplayer text with ID ${textId}:`, textError);
                return [];
            }

            if (textData) {
                fetchedText.value = textData.text;
                store.loading = false;
                // unique correct indices needed to measure player progress (depends on if force correction mode chosen or not)
                store.setupUniqueCorrectIndices(fetchedText.value.length);
            } else {
                console.error("Text still not generated for multiplayer.");
            }

            // split text into characters
            return fetchedText.value.split(" ");
        } catch (error) {
            console.error("An error occurred:", error);
            return [];
        }
    }

    return {
        fetchedText,
        fetchMultiplayerText
    };
}

interface MultiplayerGameStateManagement {
    startGame: () => void;
    endGame: (removeKeyDownListener: () => void) => void;
    resetGameState: () => void;
    stopGameActivities: (stopWpmTracking: Function, stopIndexTracking: Function, stopCountdown: Function) => void;
    resetGameActivities: (resetGameState: Function, resetStats: Function) => void;
}

// modified gamestate management for multiplayer
export function useMultiplayerGameStateManagement(): MultiplayerGameStateManagement {
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

    function stopGameActivities(stopWpmTracking: Function, stopIndexTracking: Function, stopCountdown: Function) {
        stopWpmTracking();
        stopIndexTracking();
        stopCountdown();
    }

    function resetGameActivities(resetGameState: Function, resetStats: Function) {
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

interface CountdownLogic {
    countdown: Ref<number>;
    countdownFinished: Ref<boolean>;
    showCountdown: Ref<boolean>;
    stopCountdown: () => void;
    countdownStart: () => void;
    countdownInterval: Ref<number | null>;
}

// modified countdown logic for multiplayer
export function useMultiplayerCountdownLogic(onCountdownEnd: () => void, startTime: Date | null): CountdownLogic {
    const countdown = ref<number>(DEFAULT_COUNTDOWN_VALUE);
    const countdownFinished = ref<boolean>(false);
    const showCountdown = ref<boolean>(true);
    const countdownInterval = ref<number | null>(null);

    function stopCountdown() {
        if (countdownInterval.value !== null) {
            clearInterval(countdownInterval.value);
            countdownInterval.value = null;
        }
        countdownFinished.value = false;
        showCountdown.value = false; // Hide countdown immediately
    }

    function countdownStart() {
        if (countdownInterval.value !== null) {
            clearInterval(countdownInterval.value);
        }

        countdown.value = DEFAULT_COUNTDOWN_VALUE;
        countdownFinished.value = false;
        showCountdown.value = true;

        // Calculate the delay until the startTime to allow players with different loading times to have same start time
        let delay = 0;
        if (startTime) {
            const startDateTime = new Date(startTime).getTime();
            const currentDateTime = new Date().getTime();
            delay = startDateTime - currentDateTime;
        }

        setTimeout(() => {
            countdownInterval.value = window.setInterval(() => {
                countdown.value -= 1;
                if (countdown.value < 1) {
                    if (countdownInterval.value !== null) {
                        clearInterval(countdownInterval.value);
                    }
                    countdownFinished.value = true;
                    onCountdownEnd();

                    setTimeout(() => {
                        if (countdownFinished.value) {
                            showCountdown.value = false;
                        }
                    }, 500);
                }
            }, 1000);
        }, delay);
    }

    return {
        countdown,
        countdownFinished,
        showCountdown,
        stopCountdown,
        countdownStart,
        countdownInterval,
    };
}

// modified logic for multiplayer level win 
export const handlePvPLevelWin = async () => {
    const store = useStore();
    const userId = store.userSession ? store.userSession.user.id : null;
    const newCoins = store.userCoins + 10;

    // Logic for logged-in users
    if (userId) {

        const { data, error } = await supabase
            .from("profiles")
            .update({ coins: newCoins })
            .eq("id", userId);

        if (error) {
            console.error("Error updating coins:", error);
        } else {
            // Re-fetch user coins from the store
            await store.fetchUserCoins();
            store.reloadMainMenu();
        }
    }
    // Logic for guests
    else {
        store.setUserCoins(newCoins);
    }
};


import { ref } from "vue";
import type { Ref } from "vue";
import { supabase } from "../supabase";
import { useStore } from "../stores/store";
import { DEFAULT_COUNTDOWN_VALUE } from './GameConstants';

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

            // Step 2: Fetch text based on textId from texts table
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
                // Initialize uniqueCorrectIndices based on the length of fetched text
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

export function useMultiplayerGameStateManagement(): MultiplayerGameStateManagement {
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
        console.log("Calling resetGame")
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

    function stopGameActivities(stopWpmTracking: Function, stopIndexTracking: Function, stopCountdown: Function) {
        // Stop WPM tracking
        stopWpmTracking();
        // Stop index tracking
        stopIndexTracking();
        // stop countdown logic
        stopCountdown();
    }

    function resetGameActivities(resetGameState: Function, resetStats: Function) {
        console.log("Calling resetGameStateManagement")
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

interface CountdownLogic {
    countdown: Ref<number>;
    countdownFinished: Ref<boolean>;
    showCountdown: Ref<boolean>;
    stopCountdown: () => void;
    countdownStart: () => void;
    countdownInterval: Ref<number | null>;
}

export function useMultiplayerCountdownLogic(onCountdownEnd: () => void, startTime: Date | null): CountdownLogic {
    const countdown = ref<number>(DEFAULT_COUNTDOWN_VALUE);
    const countdownFinished = ref<boolean>(false);
    const showCountdown = ref<boolean>(true);
    const countdownInterval = ref<number | null>(null);

    function stopCountdown() {
        console.log("Calling stopCountdown")
        if (countdownInterval.value !== null) {
            clearInterval(countdownInterval.value);
            countdownInterval.value = null;
        }
        countdownFinished.value = false;
        showCountdown.value = false; // Hide countdown immediately
    }

    function countdownStart() {
        console.log("Calling countdownStart");
        if (countdownInterval.value !== null) {
            clearInterval(countdownInterval.value);
        }

        countdown.value = DEFAULT_COUNTDOWN_VALUE;
        countdownFinished.value = false;
        showCountdown.value = true;

        // Calculate the delay until the startTime
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

export const handlePvPLevelWin = async () => {
    console.log("Calling handleLevelWin");
    const store = useStore();
    console.log("User won PvP Game.");
    console.log("userSession:", store.userSession);
    console.log("userCoins:", store.userCoins);
    console.log("store:", store);
    const userId = store.userSession ? store.userSession.user.id : null;
    const newCoins = store.userCoins + 10;

    // Logic for logged-in users
    if (userId) {

        console.log(
            "Updating coins for user ID:",
            userId,
            "New coins:",
            newCoins
        );

        const { data, error } = await supabase
            .from("profiles")
            .update({ coins: newCoins })
            .eq("id", userId);

        if (error) {
            console.error("Error updating coins:", error);
        } else {
            console.log("Coins updated successfully:", data);
            // Re-fetch user coins from the store
            await store.fetchUserCoins();
            store.reloadMainMenu(); // Trigger the reload of main_menu
        }
    }
    // Logic for guests
    else {
        // Update coins in the store *NOTE* disappear after refresh
        store.setUserCoins(newCoins);
    }
};


import { computed, ref } from "vue";
import type { Ref } from 'vue';
import { supabase } from "../supabase";
import { useStore } from "../stores/store"; // Import the useStore function from the Pinia store
import { WINNINGS } from './GameConstants';

// values for game logic, *NOTE* also reset in vue files logic
export const maxRounds = ref(3);

// Logic for changing result message content depening on level/single game outcome  ------------------------------------------------
// Directly called in DOM
export function getResultMessageCampaign(
    wpm: Ref<number>,
    levelFinished: Ref<boolean>,
    opponentWpmLevel: Ref<number>
) {
    const store = useStore();
    console.log("Calling getResultMessageCampaign");
    console.log("User WPM: ", wpm.value);
    console.log("Opponent WPM: ", opponentWpmLevel.value);
    return computed(() => {
        if (levelFinished.value) {
            if (
                store.playerLives === 0 ||
                (store.currentRound === maxRounds.value &&
                    store.playerLives < store.opponentLives)
            ) {
                return "Game over!";
            } else {
                return "You won the game!";
            }
        } else {
            if (wpm.value > opponentWpmLevel.value) {
                return "You won this round!";
            } else if (wpm.value < opponentWpmLevel.value) {
                return "You lost this round!";
            } else {
                return "It's a tie!";
            }
        }
    });
}

// Logic for detecting whether level/single game has ended and handling level win ------------------------------------------------
// In case of level win by user and level played being the current highest unlocked, increment coins and unlock next level, reset necessary variables

export const handleGameProgress = async (
    maxRounds: Ref<number>,
    levelFinished: Ref<boolean>,
    showResultsOverlay: Ref<boolean>,
    gameJustEnded: Ref<boolean>,
    selectedLevel: number,
    handleLevelWin: Function,
    storeLastUnlockedLevel: Ref<number>,
    levels: any[],
) => {
    // Determine if the game is over (level finished)
    const store = useStore();
    console.log("Calling handleGameProgress");
    console.log("Level Finished: ", levelFinished.value);
    console.log("Player Lives:", store.playerLives);
    console.log("Opponent Lives:", store.opponentLives);
    console.log("Current Round:", store.currentRound);
    console.log("Max Rounds:", maxRounds.value);

    if (
        store.playerLives === 0 ||
        store.opponentLives === 0 ||
        store.currentRound === maxRounds.value
    ) {
        levelFinished.value = true;
        showResultsOverlay.value = true;

        // Check if the played level is the last unlocked level
        if (selectedLevel === storeLastUnlockedLevel.value) {
            // User won the game
            if (store.playerLives > store.opponentLives) {
                await handleLevelWin(selectedLevel, levels, store.userSession, store.userCoins, store);
            }
        } else {
            console.log(
                "Playing a previously unlocked level. No progress update applied."
            );
        }
    } else {
        console.log("Level has not yet ended.");
        showResultsOverlay.value = true;
        gameJustEnded.value = true;
    }
};

export const handleLevelWin = async (
    selectedLevel: number,
    levels: any[],
) => {
    console.log("Calling handleLevelWin");
    const store = useStore();
    console.log("User won the Level.");
    console.log("userSession:", store.userSession);
    console.log("userCoins:", store.userCoins);
    console.log("store:", store);
    const userId = store.userSession ? store.userSession.user.id : null;
    const newCoins = store.userCoins + WINNINGS[selectedLevel];
    const nextLevel = selectedLevel + 1;

    // Logic for logged-in users
    if (userId) {
        // Call the update function
        const success = await updateUnlockedLevel(userId, nextLevel);
        if (success) {
            // Commit the change to the local state
            store.setLastUnlockedLevel(nextLevel);
        }

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

        // Unlock the next level if there is one and user won
        if (selectedLevel < levels.length - 1) {
            console.log("Unlocking next level:", nextLevel);
            console.log(
                "Before commit, last unlocked level:",
                store.lastUnlockedLevel
            );
            store.setLastUnlockedLevel(nextLevel);
            console.log(
                "After commit, last unlocked level:",
                store.lastUnlockedLevel
            );
        }
    }
    // Logic for guests
    else {
        // Update coins in the store *NOTE* disappear after refresh
        store.setUserCoins(newCoins);

        // Update the last unlocked level in the store if there is a next one
        if (selectedLevel < levels.length) {
            store.setLastUnlockedLevel(nextLevel);
            console.log("Setting last unlocked level to ", nextLevel, " if there is one.")
        }
    }
};


export async function updateUnlockedLevel(userId: string, newLevel: number): Promise<boolean> {
    console.log("Calling updateUnlockedLevel")
    const { data, error } = await supabase
        .from("profiles")
        .update({ last_unlocked_level: newLevel })
        .eq("id", userId);

    if (error) {
        console.error("Error updating unlocked level:", error);
        return false;
    }
    return true;
}

export function updateLivesAfterRound(wpm: number, opponentWpmLevel: Ref<number>) {
    const store = useStore();
    console.log("Calling updateLivesAfterRound")
    console.log("User WPM", wpm);
    console.log("Opponent WPM.", opponentWpmLevel.value);  // Assuming opponentWPM is accessible from this scope
    console.log("Player lives before update", store.playerLives);
    console.log("Opponent lives before update", store.opponentLives);

    if (wpm > opponentWpmLevel.value) {
        store.opponentLives -= 1;
    } else if (wpm < opponentWpmLevel.value) {
        store.playerLives -= 1;
    } else {
        // If there is a tie, both players lose a life
        store.playerLives -= 1;
        store.opponentLives -= 1;
    }
    console.log("Player lives after update", store.playerLives);
    console.log("Opponent lives after update", store.opponentLives);
}

// Logic for resetting variables for new round-------------------------------------------------------------------
// *NOTE* other functions such as resetChevron directly called in vue files, check alignment and correct reset

export const resetGameStateForNewRound = (
) => {
    console.log("Calling resetGameStateForNewRound");
    const store = useStore();
    console.log("Resetting game state for new round. Previous round:", store.currentRound);
    store.currentRound += 1;
    store.resetKeystrokes(); // *NOTE* check if correctly placed
    store.resetCorrectKeystrokes();
};


export const handleNextRound = async (
    resetGameStateForNewRound: Function,
    showResultsOverlay: Ref<boolean>,
    fetchText: Function,
    resetGameState: Function,
    countdownStart: Function,
    resetOpponentProgress: Function,
    resetStats: Function,
) => {
    console.log("Calling handleNextRound");
    resetGameStateForNewRound();
    showResultsOverlay.value = false;
    resetGameState();
    countdownStart();
    resetOpponentProgress();
    resetStats();
    await fetchText();
    console.log("handleNextRound started");
};


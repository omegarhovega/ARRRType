import { computed, ref } from "vue";
import type { Ref } from 'vue';
import { supabase } from "../supabase";
import { useStore } from "../stores/store";
import { MAX_ROUNDS, WINNINGS } from './GameConstants';

// maximum number of games for level vs. computer
export const maxRounds = ref(MAX_ROUNDS);

// Logic for changing result message content depening on level/game outcome  ------------------------------------------------
// Directly called in DOM
export function getResultMessageCampaign(
    wpm: Ref<number>,
    levelFinished: Ref<boolean>,
    opponentWpmLevel: Ref<number>
) {
    const store = useStore();
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

// Logic for detecting whether level/game has ended and handling level win ------------------------------------------------
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
    const store = useStore();

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
        showResultsOverlay.value = true;
        gameJustEnded.value = true;
    }
};

export const handleLevelWin = async (
    selectedLevel: number,
    levels: any[],
) => {
    const store = useStore();
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
            store.reloadMainMenu(); // Trigger the reload of main_menu to see the updated coins number
        }

        // Unlock the next level if there is one and user won
        if (selectedLevel < levels.length - 1) {
            console.log("Unlocking next level:", nextLevel);
            store.setLastUnlockedLevel(nextLevel);
        }
    }
    // Logic for guests
    else {
        // Update coins in the store *NOTE* disappear after refresh
        store.setUserCoins(newCoins);
        console.log("Coins updated successfully:", newCoins);

        // Update the last unlocked level in the store if there is a next one
        if (selectedLevel < levels.length) {
            store.setLastUnlockedLevel(nextLevel);
            console.log("Unlocking next level:", nextLevel)
        }
    }
};


export async function updateUnlockedLevel(userId: string, newLevel: number): Promise<boolean> {
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

    if (wpm > opponentWpmLevel.value) {
        store.opponentLives -= 1;
    } else if (wpm < opponentWpmLevel.value) {
        store.playerLives -= 1;
    } else {
        // If there is a tie, both players lose a life
        store.playerLives -= 1;
        store.opponentLives -= 1;
    }
    console.log("Player lives after round", store.playerLives);
    console.log("Opponent lives after round", store.opponentLives);
}

// Logic for resetting variables for new round-------------------------------------------------------------------
// *NOTE* sequence of reset commands important

export const resetGameStateForNewRound = (
) => {
    const store = useStore();
    store.currentRound += 1;
    store.resetKeystrokes();
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
    resetGameStateForNewRound();
    showResultsOverlay.value = false;
    resetGameState();
    countdownStart();
    resetOpponentProgress();
    resetStats();
    await fetchText();
};


import { computed, ref } from "vue";
import type { Ref } from 'vue';
import { supabase } from "../../supabase";
import { useStore } from "../../stores/store";
import { MAX_ROUNDS, WINNINGS } from '../GameLogic/GameConstants';

// maximum number of games per level
export const maxRounds = ref(MAX_ROUNDS);

// Result message content depening on level/game outcome
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

// Detecting whether level/game has ended and handling level win
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

        // Check if the played level is the last unlocked level and if user won the game
        if (selectedLevel === storeLastUnlockedLevel.value) {
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
        // Update the last unlocked level in the store if there is a next one
        const success = await updateUnlockedLevel(userId, nextLevel);
        if (success) {
            store.setLastUnlockedLevel(nextLevel);
        }

        const { data, error } = await supabase
            .from("profiles")
            .update({ coins: newCoins })
            .eq("id", userId);

        if (error) {
            console.error("Error updating coins:", error);
        } else {
            // Re-fetch user coins from the store
            await store.fetchUserCoins();
            // Trigger the reload of main_menu to see the updated coins number
            store.reloadMainMenu();
        }

        // Unlock the next level if there is one and user won
        if (selectedLevel < levels.length - 1) {
            store.setLastUnlockedLevel(nextLevel);
        }
    }
    // Logic for guests
    else {
        // Update coins in the store
        store.setUserCoins(newCoins);

        // Update the last unlocked level in the store if there is a next one
        if (selectedLevel < levels.length) {
            store.setLastUnlockedLevel(nextLevel);
        }
    }
};

// Update last unlocked level for logged in users
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

// Reduces lives for players / computer opponents if they loose, or for both if result is a draw
export function updateLivesAfterRound(wpm: number, opponentWpmLevel: Ref<number>) {
    const store = useStore();

    if (wpm > opponentWpmLevel.value) {
        store.opponentLives -= 1;
    } else if (wpm < opponentWpmLevel.value) {
        store.playerLives -= 1;
    } else {
        store.playerLives -= 1;
        store.opponentLives -= 1;
    }
}

// Logic for resetting variables for new round
// Sequence of reset commands needs to be maintained

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


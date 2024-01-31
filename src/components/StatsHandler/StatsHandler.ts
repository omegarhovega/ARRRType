import type { Ref, ComputedRef } from "vue";
import { useStore } from "../../stores/store";

// Reusable wrapper function for convenience, combines calc. consistency, update and save statistics after round
// *NOTE* manual threshold set here: Results in a round where accuarcy is 50% or below will not be saved
export function saveGameStatistics(
    wpm: ComputedRef<number>,
    grossWpm: ComputedRef<number>,
    accuracy: Ref<number> | ComputedRef<number>,
    errors: Ref<Array<{ attempted: string; expected: string; word: string }>>,
    wpmPerSecond: Ref<number[]>,
    grossWpmPerSecond: Ref<number[]>,
    totalOccurrences: Ref<{ [key: string]: number; }>,
    mistakesMade: Ref<{ [key: string]: number; }>,
    consistencyForStat: ComputedRef<number>,
    updateStats: Function,
    saveStats: Function,
) {
    const store = useStore();

    if (store.endTime && store.startTime !== null && accuracy.value > 50) {

        // Update stats
        updateStats(
            wpm.value,
            grossWpm.value,
            accuracy.value,
            wpmPerSecond.value,
            grossWpmPerSecond.value,
            errors.value,
            totalOccurrences.value,
            mistakesMade.value,
            consistencyForStat
        );

        // Save stats
        if (store.userSession && accuracy.value > 50) {
            saveStats(store.userSession);
        } else if (accuracy.value > 50) {
            saveStats(); // For guest users, save to local storage
        } else {
            console.log("Encountered exception saving results.")
        }
    } else {
        console.log("Results not saved.")
    }
}
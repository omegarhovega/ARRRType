import { ref } from "vue";
import { useStore } from "../../stores/store";
import { wpmPerSecond, grossWpmPerSecond, previousKeystrokes, previousCorrectKeystrokes } from './../Stats/WPMAccPerSecond'

// 1. Update Stats
// *NOTE* excludes stats < 50% (might show results not saved for last round still, consider amending)
export function updateStats(newWpm: number, newGrossWpm: number, newAccuracy: number, newWpmPerSecond: number[], newGrossWpmPerSecond: number[], errors: Array<{ attempted: string, expected: string, word: string }>, totalOccurrences: { [key: string]: number }, mistakesMade: { [key: string]: number }, consistency: number) {
    const store = useStore();
    const roundId = ref(0);
    if (newAccuracy > 50) {
        try {
            roundId.value++;
            const newRound = {
                id: roundId.value,
                timestamp: new Date(),
                wpm: newWpm,
                grossWPM: newGrossWpm,
                accuracy: newAccuracy,
                wpmPerSecond: newWpmPerSecond,
                grossWpmPerSecond: newGrossWpmPerSecond,
                errors: errors,
                totalOccurrences: totalOccurrences,
                mistakesMade: mistakesMade,
                consistency: consistency
            };
            store.userStats.push(newRound);
        } catch (e) {
            console.error("Error while updating stats:", e);
        }
    } else {
        console.log("Statistics not updated due to accuracy being below 50%")
    }
}

// 2. Reset Stats
export function resetStats() {
    const store = useStore();
    // reset data in Pinia store in preaparation of new round, after saving key variables to local store/database
    store.resetUserStats(); //(sets id, timestamp, wpm, grossWPM accuracy, errors, totalOccurrences, mistakesMade, consistency to null)
    store.resetKeystrokes();
    store.resetCorrectKeystrokes();
    store.resetWordsPerSecond(); // resets slowly typed words
    store.resetUniqueCorrectIndices();
    wpmPerSecond.value = []; // resets WPM per second values
    grossWpmPerSecond.value = [];
    previousKeystrokes.value = 0;
    previousCorrectKeystrokes.value = 0;
}

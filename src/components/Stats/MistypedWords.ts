import { ref, computed } from "vue";
import { useStore } from "../../stores/store";

export const historicalWordErrors = ref<{ [key: string]: number }>({});

// all-time mistyped words from local or database storage (to be called after userStats is populated with historical data after retrieveStats() call)
export const topMistypedWords = computed(() => {
    const store = useStore();

    // Check if userStats.value is populated
    if (store.userStats && store.userStats.length > 0) {
        store.userStats.forEach(stat => {
            // Create a set to store unique error words for the current round
            const uniqueErrorWords = new Set<string>();

            // Check if errors is defined and is an array before calling forEach
            if (stat.errors && Array.isArray(stat.errors)) {
                stat.errors.forEach(error => {
                    // Check if the error word is not undefined and is not a punctuation
                    if (error.word && ![".", ",", "!", "?", ";", ":", "-", "(", ")", "[", "]", "{", "}", "<", ">", "\"", "'", "Space"].includes(error.word)) {
                        // Add the word to the unique error words set
                        uniqueErrorWords.add(error.word);
                    }
                });
            }

            // Update the error count for each unique error word in historical data
            uniqueErrorWords.forEach(word => {
                if (!historicalWordErrors.value[word]) {
                    historicalWordErrors.value[word] = 0;
                }
                historicalWordErrors.value[word]++;
            });

            // Reset unique error words for the current round
            uniqueErrorWords.clear();
        });
    }

    return Object.entries(historicalWordErrors.value)
        .sort(([, aFreq], [, bFreq]) => bFreq - aFreq)
        .slice(0, 13)
        .map(([text, frequency]) => ({ text, frequency }));
});

// last round mistyped words
export const lastRoundMistypedWords = computed(() => {
    const store = useStore();
    const lastRound = store.userStats[store.userStats.length - 1];
    if (!lastRound || !lastRound.errors) return [];

    const uniqueWords = new Set<string>();

    lastRound.errors.forEach(error => {
        // Check if the error word is not undefined, not empty, and is not a punctuation
        if (error.word && typeof error.word === 'string' && error.word.trim() && ![".", ",", "!", "?", ";", ":", "-", "(", ")", "[", "]", "{", "}", "<", ">", "\"", "'", "Space"].includes(error.word)) {
            uniqueWords.add(error.word);
        }
    });

    return Array.from(uniqueWords);
});
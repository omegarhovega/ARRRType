import { ref, computed } from "vue";
import { useStore } from "../../stores/store";

// aggregated data for mistyped characters heatmap
export const aggregatedData = ref<{ totalOccurrences: { [key: string]: number }, mistakesMade: { [key: string]: number } }>({
    totalOccurrences: {},
    mistakesMade: {}
});

// calculating all-time error rates for heatmap
export const errorRates = computed(() => {
    const rates: { [key: string]: number } = {};
    for (const char of Object.keys(aggregatedData.value.totalOccurrences)) {
        const total = aggregatedData.value.totalOccurrences[char];
        const mistakes = aggregatedData.value.mistakesMade[char] || 0;
        rates[char] = mistakes / total;
    }
    return rates;
});

// function to establish the most missed characters for loading training text based on them
export function getTopMistypedCharacters(): string[] {
    const topMistyped: string[] = [];
    // Assume errorRates is sorted
    for (const [char, rate] of Object.entries(errorRates.value)) {
        if (topMistyped.length < 5) { // limit to top 5
            topMistyped.push(char);
        }
    }
    return topMistyped;
}


// calculating last round error rates for heatmap 
export const lastRoundErrorRates = computed(() => {
    const store = useStore();
    const lastRound = store.userStats[store.userStats.length - 1];
    if (!lastRound) return {};

    const rates: { [key: string]: number } = {};
    for (const char of Object.keys(lastRound.totalOccurrences)) {
        const total = lastRound.totalOccurrences[char];
        const mistakes = lastRound.mistakesMade[char] || 0;
        rates[char] = mistakes / total; // error rate is 0 if mistake at char is none
    }
    return rates;
});

// Function to aggregate heatmap data for AllTimeStats
export function aggregateHeatmapData(): void {
    const store = useStore();
    try {
        // Reset aggregated data
        aggregatedData.value = {
            totalOccurrences: {},
            mistakesMade: {}
        };

        // iterates over total userStats data
        store.userStats.forEach(stat => {
            for (const char of Object.keys(stat.totalOccurrences)) {
                const lowerChar = char.toLowerCase(); // Ensure we don't differentiate between upper and lower case
                if (!aggregatedData.value.totalOccurrences[lowerChar]) {
                    aggregatedData.value.totalOccurrences[lowerChar] = 0;
                    aggregatedData.value.mistakesMade[lowerChar] = 0;
                }
                aggregatedData.value.totalOccurrences[lowerChar] += stat.totalOccurrences[char];
                aggregatedData.value.mistakesMade[lowerChar] += (stat.mistakesMade[char] || 0);
            }
        });

    } catch (e) {
        console.error("Error while aggregating heatmap data:", e);
    }
}

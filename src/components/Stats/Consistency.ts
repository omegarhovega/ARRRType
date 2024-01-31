import { computed } from "vue";
import { useStore } from "../../stores/store";
import { wpm } from "./WPMAccAverage";
import { wpmPerSecond } from "./WPMAccPerSecond";

// Calculate consistency for last round
export const consistencyForStat = computed(() => {
    const store = useStore();
    if (store.endTime && store.startTime !== null) {
        const consistencyForStat = calculateConsistency();
        return consistencyForStat;
    } else {
        return 0;
    }
});

// consistency defined as standard deviation divided by WPM as percentage (average variation around average WPM)
export function calculateConsistency(): number {
    try {
        if (wpmPerSecond.value.length === 0) return 0;  // Return a default value if the array is empty

        // mean wpm used for whole test (avoids impresicision caused by measuring WPMperSecond in intervals which discards partial inverval data)
        const squaredDifferences = wpmPerSecond.value.map(value => Math.pow(value - wpm.value, 2));
        const sumOfSquaredDifferences = squaredDifferences.reduce((total, value) => total + value, 0);
        const variance = sumOfSquaredDifferences / (wpmPerSecond.value.length - 1);
        const standardDeviation = Math.sqrt(variance);

        // Calculate the Coefficient of Variation (consistency)
        const relativeConsistency = (standardDeviation / wpm.value) * 100;
        return relativeConsistency;
    } catch (e) {
        console.error("Error while calculating consistency", e);
        return 0;
    }
}
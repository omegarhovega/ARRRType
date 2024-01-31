import { ref, computed } from "vue";
import type { Ref } from "vue";
import { useStore } from "../../stores/store";

export const wpmPerSecond: Ref<number[]> = ref([]);
export const grossWpmPerSecond: Ref<number[]> = ref([]);
export const previousKeystrokes: Ref<number> = ref(0);
export const previousCorrectKeystrokes: Ref<number> = ref(0);
export let interval: number | null = null;

// start WPM per second tracking for round (for last round per second stat overview)
export function startWpmTracking() {
    try {
        interval = setInterval(() => {
            const store = useStore();
            // Calculate WPM per second based on correct keystrokes in interval and update respective arrays
            const wpmForSecond = ((store.correctKeystrokes - previousCorrectKeystrokes.value) / 5) * 60;
            const grossWpmForSecond = ((store.totalKeystrokes - previousKeystrokes.value) / 5) * 60;

            wpmPerSecond.value.push(wpmForSecond);
            grossWpmPerSecond.value.push(grossWpmForSecond);

            // Update the previous keystrokes for the next iteration
            previousCorrectKeystrokes.value = store.correctKeystrokes;
            previousKeystrokes.value = store.totalKeystrokes;

        }, 1000) as unknown as number;
    } catch (e) {
        console.error("Error while starting WPM Tracking:", e);
    }
}

// stop WPM per second tracking for round, called after round to ensure that it is reset before next
export function stopWpmTracking() {
    try {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        previousKeystrokes.value = 0; // resets between each round
        previousCorrectKeystrokes.value = 0; // resets between each round
    } catch (e) {
        console.error("Error while stopping WPM Tracking:", e);
    }
}

// calculate accuracy per second for last round using logged gross/net wpm tracking data
// accuracy is measured as WPM / Gross WPM
export const accuracyPerSecond = computed((): (number | null)[] => {
    const accuracies: (number | null)[] = [];
    for (let i = 0; i < wpmPerSecond.value.length; i++) {
        const wpm = wpmPerSecond.value[i];
        const grossWpm = grossWpmPerSecond.value[i];
        if (grossWpm === 0) {
            accuracies.push(null); // Changed from 0 to null for division by zero
        } else {
            const accuracy = (wpm / grossWpm) * 100;
            accuracies.push(accuracy);
        }
    }
    return accuracies;
});



import { ref, computed } from "vue";
import { useStore } from "../stores/store"; // Import the useStore function from the Pinia store

export function useOpponentLogic(fetchedText: any, opponentWpmLevel: any, onOpponentFinish: () => void, onOpponentStatusChange?: (status: boolean, opponentWpm: number) => void) {
    // Pinia store
    const store = useStore();

    const opponentEnabled = computed(() => store.opponentEnabled);
    const opponentProgress = ref<number>(0);
    const opponentProgressInterval = ref<number | undefined>(undefined);

    function resetOpponentProgress() { // redundant to stopOpponentProgress?
        console.log("Calling resetOpponentProgress"); // Debugging log
        clearInterval(opponentProgressInterval.value);
        opponentProgress.value = 0;
    }

    function startOpponentProgress() {
        console.log("Calling startOpponentProgress")
        clearInterval(opponentProgressInterval.value);

        opponentProgressInterval.value = setInterval(() => {
            const opponentIncrement =
                (opponentWpmLevel.value * 5 * 100) / (fetchedText.value.length * 600);

            opponentProgress.value = Math.min(
                opponentProgress.value + opponentIncrement,
                100
            );

            // Check if the opponent has reached the end
            if (opponentProgress.value >= 100) {
                // Opponent has reached the end, call the callback
                onOpponentFinish();
            }

        }, 100) as unknown as number;
    }


    function stopOpponentProgress() {
        console.log("Calling stopOpponentProgress")
        // stops backgound coloring if player finishes first
        clearInterval(opponentProgressInterval.value);
        opponentProgressInterval.value = undefined;
    }

    // Relevant for situations where player can change opponent on/off switch
    function handleOpponentStatusChange(status: boolean) {
        store.setOpponentEnabled(status);
        localStorage.setItem("opponentEnabled", JSON.stringify(status));

        if (!status) {
            stopOpponentProgress();
        }

        // Call the callback only if it exists (relevant for Training)
        if (onOpponentStatusChange) {
            onOpponentStatusChange(status, opponentWpmLevel.value);
        }
    }

    return {
        opponentWpmLevel,
        opponentEnabled,
        opponentProgress,
        startOpponentProgress,
        stopOpponentProgress,
        resetOpponentProgress,
        handleOpponentStatusChange,
    };
}

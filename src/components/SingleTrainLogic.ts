import { reactive, ref, computed, nextTick } from 'vue';
import type { ComputedRef } from 'vue';
import type { ComponentPublicInstance } from "vue";
import { useStore } from "../stores/store";
import { useUtilities } from "./Utilities";

// Data Structures
interface SingleWordStats {
    wpm: number;
    accuracy: number;
    startTime: number;
    endTime: number;
}

// Reactive State
const singleWordStatsList = reactive<SingleWordStats[]>([]);
const currentWordIndex = ref<number>(0);
const currentWord = ref<string>("");
const currentWordStartTime = ref<number>(0);
const currentWordEndTime = ref<number>(0);
const singleWordInput = ref<string>("");
const fetchedWords = ref<string[]>([]);
const currentWordCharIndex = ref<number>(0);

// Computed State
const averageWPM = computed(() => {
    const totalWPM = singleWordStatsList.reduce((sum, stats) => sum + stats.wpm, 0);
    return singleWordStatsList.length ? totalWPM / singleWordStatsList.length : 0;
});

const averageAccuracy = computed(() => {
    const totalAccuracy = singleWordStatsList.reduce((sum, stats) => sum + stats.accuracy, 0);
    return singleWordStatsList.length ? totalAccuracy / singleWordStatsList.length : 0;
});


// logic for single word training
function initializeSingleWordTraining() {
    const store = useStore();
    const { fetchText } = useUtilities().useTextManagement('single');
    fetchText(store.numberOfWords).then((words) => {
        if (words && words.length > 0) {
            store.startTime = new Date();
            store.currentWordStartTime = new Date();
            fetchedWords.value = words;
            currentWordIndex.value = 1;
            currentWordCharIndex.value = 0;
            currentWord.value = words[0];
            singleWordStatsList.length = 0;
        } else {
            console.error("No words were fetched");
        }
    }).catch(error => {
        console.error(`Error fetching words: ${error}`);
    });
}

interface SetupKeyboardEventReturns {
    handleKeyDown: (event: KeyboardEvent) => void;
    initialize: (resetGameState: Function, resetChevronPosition: Function, countdownStart: Function, isFinished: any, recalculateCurrentWord: Function, currentWordArray: any) => void;
    handleGameEnd: (stopCountdown: Function, isFinished: any) => void;
    recalculateCurrentWord: () => any;
    currentWordArray: ComputedRef<string[]>;
}

const isFinished = ref(false);
const charSpans = ref<(Element | ComponentPublicInstance)[]>([]);


function setupKeyboardEvent(
    resetGameState: Function,
    resetChevronPosition: Function,
    chevronTop: any,
    chevronLeft: any,
    countdownStart: Function,
    stopCountdown: Function,
    isFinished: any,
): SetupKeyboardEventReturns {

    const store = useStore();
    const {
        saveTotalTimePlayed,
    } = useUtilities();

    // split text into words
    function recalculateCurrentWord() {
        const currentWords = computed(() => currentWord.value.split(""));
        return currentWords;
    }

    const currentWordArray = recalculateCurrentWord();

    // logic to restart single-word game
    function initialize(
        resetGameState: Function,
        resetChevronPosition: Function,
        chevronTop: any,
        chevronLeft: any,
        countdownStart: Function,
        isFinished: any,
        recalculateCurrentWord: Function,
        currentWordArray: any,
    ) {
        resetGameState();
        resetChevronPosition(chevronTop, chevronLeft);
        fetchedWords.value = [""];
        recalculateCurrentWord();
        currentWordArray;
        currentWordIndex.value = 1;
        currentWordCharIndex.value = 0;
        currentWord.value = ""; // Set the initial word here
        singleWordStatsList.length = 0;
        store.typed = {};
        countdownStart();
        isFinished.value = false;
    }


    function handleGameEnd(stopCountdown: Function, isFinished: any) {
        store.endTime = new Date();
        stopCountdown();
        window.removeEventListener("keydown", handleKeyDown);
        isFinished.value = true;
        saveTotalTimePlayed();
    }

    // modified logic for single-word game, handled on word by word basis
    function handleKeyDown(event: KeyboardEvent) {
        if (isFinished.value) {
            if (event.key === "r" || event.key === "R") {
                initialize(resetGameState, resetChevronPosition, chevronTop, chevronLeft, countdownStart, isFinished, recalculateCurrentWord, currentWordArray);
            }
            return;
        }

        if (currentWord.value.length === 0) return;

        const excludeKeys = [
            "Shift",
            "Tab",
            "Alt",
            "Ctrl",
            "Control",
            "Meta",
            "Option",
            "OS",
            "CapsLock",
        ];
        if (/^F\d+$/.test(event.key) || excludeKeys.includes(event.key)) {
            return;
        }

        const expectedChar = currentWord.value[currentWordCharIndex.value];

        if (event.key === expectedChar) {
            store.correctKeystrokes++;
        }

        store.totalKeystrokes++;

        if (event.key === "Backspace") {
            if (event.ctrlKey) {
                deleteWholeWord();
            } else {
                deleteLastChar();
            }
            return;
        }

        store.typed[currentWordCharIndex.value] = event.key;
        currentWordCharIndex.value++;
        store.currentIndex = currentWordCharIndex.value;

        if (currentWordCharIndex.value >= currentWord.value.length) {
            endWordTimeTracking();
            updateSingleWordStats();

            // Reset for the next word
            currentWordCharIndex.value = 0;
            store.totalKeystrokes += currentWord.value.length;
            store.currentIndex = 0;

            // Reset the 'typed' state
            store.typed = {};

            // continues to next word
            loadNextWord(() => {
                nextTick(() => {
                    charSpans.value = [];
                    const spans = document.querySelectorAll(".line-wrapper span");
                    spans.forEach((span) => charSpans.value.push(span));
                });
            });
        }
    }

    type AfterLoadCallback = () => void;

    function loadNextWord(afterLoad?: AfterLoadCallback) {
        const store = useStore();
        if (currentWordIndex.value < fetchedWords.value.length) {
            currentWord.value = fetchedWords.value[currentWordIndex.value];  // Updated line

            // Reset the relevant statistics for the new word
            store.correctKeystrokes = 0;
            store.totalKeystrokes = 0;
            currentWordCharIndex.value = 0;

            store.currentWordStartTime = new Date();
            currentWordStartTime.value = Date.now();
            currentWordIndex.value++; // Move this line here

            // Call the afterLoad callback, if provided
            if (afterLoad) {
                afterLoad();
            }
        } else if (currentWordIndex.value >= fetchedWords.value.length) { // final word is reached
            handleGameEnd(stopCountdown, isFinished); // Directly call handleGameEnd
            fetchedWords.value = [];
            return;
        }
    }
    return {
        handleKeyDown,
        initialize: () => initialize(resetGameState, resetChevronPosition, chevronTop, chevronLeft, countdownStart, isFinished, recalculateCurrentWord, currentWordArray),
        handleGameEnd: () => handleGameEnd(stopCountdown, isFinished),
        recalculateCurrentWord,
        currentWordArray,
    };
}

// functions to start and stop time tracking for each new word
function startWordTimeTracking() {
    currentWordStartTime.value = new Date().getTime();
}

function endWordTimeTracking() {
    currentWordEndTime.value = new Date().getTime();
}

// Update Statistics on a word-by-word basis
function updateSingleWordStats() {
    const store = useStore();

    // Get the current time for endTime
    currentWordEndTime.value = new Date().getTime();

    // Get the start time from the store
    if (store.currentWordStartTime) {
        currentWordStartTime.value = store.currentWordStartTime.getTime();
    } else {
        console.error("startTime is null. Cannot update stats.");
        return;
    }

    // Calculate the total time taken for the current word
    const totalTime = currentWordEndTime.value - currentWordStartTime.value;

    // Calculate WPM
    const wpm = totalTime > 0 ? Math.floor((store.correctKeystrokes / 5) / (totalTime / (60 * 1000))) : 0;

    // Calculate accuracy
    const accuracy = store.totalKeystrokes > 0 ? (store.correctKeystrokes / store.totalKeystrokes) * 100 : 0;

    // Create stats object
    const stats: SingleWordStats = {
        wpm,
        accuracy,
        startTime: currentWordStartTime.value,
        endTime: currentWordEndTime.value
    };

    // Push the stats for the current word into the list
    singleWordStatsList.push(stats);
}

function deleteLastChar() {
    const store = useStore();
    if (currentWordCharIndex.value > 0) {
        currentWordCharIndex.value--;
        store.currentIndex = currentWordCharIndex.value;

        // Delete the last typed character
        delete store.typed[currentWordCharIndex.value];
        store.typed = { ...store.typed };  // Trigger reactivity
    }
}

// Finalize Test
function finalizeSingleWordTest(handleGameEnd?: () => void) {
    // Calculate average WPM and accuracy, maybe save to database
    if (handleGameEnd) {
        handleGameEnd();
    }
}

function deleteWholeWord() {
    const store = useStore();

    // Find the index where the last word starts
    let lastIndex = currentWordCharIndex.value - 1;
    while (lastIndex >= 0 && currentWord.value[lastIndex] !== " ") {
        lastIndex--;
    }

    // Delete characters from the last word
    for (let i = currentWordCharIndex.value - 1; i > lastIndex; i--) {
        delete store.typed[i];
    }

    // Update the current index
    currentWordCharIndex.value = lastIndex + 1;
    store.currentIndex = currentWordCharIndex.value;

    // Trigger reactivity
    store.typed = { ...store.typed };
}

function detectCapsLock(event: KeyboardEvent) {
    const store = useStore();
    store.isCapsLockOn = event.getModifierState("CapsLock");
}

export {
    singleWordStatsList,
    currentWordCharIndex,
    currentWordIndex,
    currentWord,
    currentWordStartTime,
    currentWordEndTime,
    singleWordInput,
    averageWPM,
    averageAccuracy,
    fetchedWords,
    isFinished,
    charSpans,
    setupKeyboardEvent,
    detectCapsLock,
    deleteWholeWord,
    initializeSingleWordTraining,
    startWordTimeTracking,
    endWordTimeTracking,
    updateSingleWordStats,
    finalizeSingleWordTest,
    deleteLastChar,
};

// SingleTrainLogic.ts

// Import required dependencies and types
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


// Initialization Function
function initializeSingleWordTraining() {
    const store = useStore();
    console.log("initializeSingleWordTraining called");
    const { fetchText } = useUtilities().useTextManagement('single');
    fetchText(store.numberOfWords).then((words) => {
        if (words && words.length > 0) {
            console.log(`Fetched words are: ${words}`);
            store.startTime = new Date();
            store.currentWordStartTime = new Date();
            fetchedWords.value = words;
            currentWordIndex.value = 1;
            currentWordCharIndex.value = 0;
            currentWord.value = words[0];  // Set the initial word here
            singleWordStatsList.length = 0;
        } else {
            console.error("No words were fetched");
        }
    }).catch(error => {
        console.error(`Error fetching words: ${error}`);
    });
}

//HANDLEKEYDOWN

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
    function recalculateCurrentWord() {
        const currentWords = computed(() => currentWord.value.split(""));
        return currentWords;
    }

    const currentWordArray = recalculateCurrentWord();

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
        console.log("Restarting game");
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
        console.log("Calling handleGameEnd")
        store.endTime = new Date();
        stopCountdown();
        window.removeEventListener("keydown", handleKeyDown);
        isFinished.value = true;
        saveTotalTimePlayed();
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (isFinished.value) {
            if (event.key === "r" || event.key === "R") {
                console.log("Restarting game via shortcut");
                initialize(resetGameState, resetChevronPosition, chevronTop, chevronLeft, countdownStart, isFinished, recalculateCurrentWord, currentWordArray);
            }
            return;
        }

        console.log(`Key pressed: ${event.key}`);

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
        console.log(
            `Expected char Index: ${currentWordCharIndex}, Expected char: ${expectedChar}, Key pressed: ${event.key}`
        );

        if (event.key === expectedChar) {
            console.log("Correct key pressed");
            store.correctKeystrokes++;
        }

        store.totalKeystrokes++;

        if (event.key === "Backspace") {
            if (event.ctrlKey) {
                deleteWholeWord(); // Create this function to handle deleting the whole word
            } else {
                deleteLastChar();
            }
            return;
        }

        store.typed[currentWordCharIndex.value] = event.key;
        currentWordCharIndex.value++;
        store.currentIndex = currentWordCharIndex.value;

        if (currentWordCharIndex.value >= currentWord.value.length) {
            console.log("End of word reached");
            endWordTimeTracking();
            updateSingleWordStats();

            // Reset for the next word
            currentWordCharIndex.value = 0;
            store.totalKeystrokes += currentWord.value.length;
            store.currentIndex = 0;

            // Reset the 'typed' state
            store.typed = {};

            console.log("Loading next word");
            loadNextWord(() => {
                nextTick(() => {
                    charSpans.value = [];
                    const spans = document.querySelectorAll(".line-wrapper span");
                    spans.forEach((span) => charSpans.value.push(span));
                });
            });
        }
        console.log(`Current word is: ${currentWord.value}`);
    }

    type AfterLoadCallback = () => void;

    function loadNextWord(afterLoad?: AfterLoadCallback) {
        console.log('loadNextWord called');
        console.log(`Current index is: ${currentWordIndex.value}, Total words: ${fetchedWords.value.length}`);
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
        } else if (currentWordIndex.value >= fetchedWords.value.length) {
            console.log("Reached the end of the word list. Finalizing game.");
            handleGameEnd(stopCountdown, isFinished); // Directly call handleGameEnd
            fetchedWords.value = [];
            return;
        }
    }
    return {
        handleKeyDown,  // The handleKeyDown function
        initialize: () => initialize(resetGameState, resetChevronPosition, chevronTop, chevronLeft, countdownStart, isFinished, recalculateCurrentWord, currentWordArray),
        handleGameEnd: () => handleGameEnd(stopCountdown, isFinished),
        recalculateCurrentWord,
        currentWordArray,
    };
}

// Start Time Tracking
function startWordTimeTracking() {
    currentWordStartTime.value = new Date().getTime();
}

// End Time Trackinggar
function endWordTimeTracking() {
    currentWordEndTime.value = new Date().getTime();
}

// Update Stats
// Update Stats
function updateSingleWordStats() {
    const store = useStore();

    // Get the current time for endTime
    currentWordEndTime.value = new Date().getTime();
    console.log("Current End Time.", currentWordEndTime.value);

    // Get the start time from the store
    if (store.currentWordStartTime) {
        currentWordStartTime.value = store.currentWordStartTime.getTime();
        console.log("Start Time.", store.currentWordStartTime.getTime());
    } else {
        console.error("startTime is null. Cannot update stats.");
        return;
    }

    // Calculate the total time taken for the current word
    const totalTime = currentWordEndTime.value - currentWordStartTime.value;
    console.log("Total time:", totalTime);

    // Calculate WPM
    const wpm = totalTime > 0 ? Math.floor((store.correctKeystrokes / 5) / (totalTime / (60 * 1000))) : 0;
    console.log("Correct Keystrokes:", store.correctKeystrokes);
    console.log("WPM:", wpm);

    // Calculate accuracy
    const accuracy = store.totalKeystrokes > 0 ? (store.correctKeystrokes / store.totalKeystrokes) * 100 : 0;
    console.log("Accuracy:", accuracy);

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


// Load Next Word


// Inside SingleTrainLogic.ts
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
    console.log("Calling detectCapslock");
    store.isCapsLockOn = event.getModifierState("CapsLock");
}

// Export all necessary reactive states and functions
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

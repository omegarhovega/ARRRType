import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import type { Ref } from 'vue';
import { useStore } from "../stores/store"; // Import the useStore function from the Pinia store
import { updateScrollPosition } from "./ScrollingLogic"; // Import the useStore function from the Pinia store

interface TypingTextHandler {
    accuracy: Ref<number>;
    totalOccurrences: Ref<{ [key: string]: number }>;
    mistakesMade: Ref<{ [key: string]: number }>;
    detectCapsLock: (event: KeyboardEvent) => void;
    handleKeyDown: (event: KeyboardEvent) => void;
    deleteLastChar: () => void;
    deleteLastWord: () => void;
    typeChar: (char: string) => void;
    startIndexTracking: () => void;
    stopIndexTracking: () => void;
    removeKeyDownListener: () => void;
    wordsPerSecond: Ref<string[][]>;
    resetHasMistake: () => void;
    hasMistake: Ref<boolean>;
}



function splitText(text: string): string[] {
    // This regex splits on word boundaries and ignores punctuation/symbols
    return text.match(/\b(?:[a-zA-Z-]+['’]?[a-zA-Z-]*|[.,!?;])\b/g) || [];
}

// determine the word at the current index
export function useIndexToWordMapping(fetchedText: Ref<string>) {
    const indexToWordMapping: Record<number, string> = {};

    watch(fetchedText, (newText) => {
        let wordIndex = 0;
        const allWords = splitText(newText); // split text into words ignoring punctuation/symbols

        for (let i = 0; i < newText.length; i++) {
            if (newText[i] === " ") {
                indexToWordMapping[i] = "Space";
            } else {
                indexToWordMapping[i] = allWords[wordIndex]; // every character has word mapped to it
                if (
                    i + 1 < newText.length &&
                    (newText[i + 1] === " " || i + 1 === newText.length - 1)
                ) {
                    wordIndex++; // new word when space is read, considers text length
                }
            }
        }
    });

    return {
        indexToWordMapping,
    };
}

export function useTypingTextHandler(
    fetchedText: Ref<string>,
    scrollContainer: Ref<HTMLElement | null>,
    onTypingEnd: () => void | Promise<void>, // function to run when player finishes first
    currentChar: Ref<string>,
    currentProgress?: Ref<number>,
    noEndWithoutCorrection?: Ref<boolean>
): TypingTextHandler {
    const store = useStore();
    const errors = computed(() => store.errors);
    const totalOccurrences = ref<{ [key: string]: number }>({});
    const mistakesMade = ref<{ [key: string]: number }>({});
    const { indexToWordMapping } = useIndexToWordMapping(fetchedText);

    const accuracy = computed(() => Math.round((store.correctKeystrokes / store.totalKeystrokes) * 100));

    const hasMistake = ref(false);

    function handleKeyDown(event: KeyboardEvent) {
        const store = useStore();
        console.log("Calling handleKeyDown");
        if (!store.typingAllowed) {
            return; // Exit the function if typing is not allowed
        }

        // Prevent default browser behavior for space bar *NOTE* to prevent Firefox from scrolling on space
        if (event.key === ' ') {
            event.preventDefault();
        }
        // Check if the key is a character key, Backspace, or not a functional key like Shift, Control, etc.
        if (
            (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !["Shift", "Control", "Alt", "Meta"].includes(event.key)) ||
            event.key === 'Backspace'
        ) {

            //Prevent progress when mistake is made until it is corrected (otherwise stuck at incorrect index) - only active if switch on and currently not used
            if (store.forceMistakeCorrection && hasMistake.value && event.key !== 'Backspace') {
                return;  // Prevent further typing until the mistake is corrected
            }
            // Handle the error recording, but exclude 'Backspace'
            // Inside handleKeyDown function
            if (event.key !== currentChar.value && event.key !== 'Backspace') {
                const wordForCurrentIndex = indexToWordMapping[store.currentIndex];

                console.log("Error detected:", {
                    typed: event.key,
                    expected: currentChar.value,
                    position: store.currentIndex,
                    word: wordForCurrentIndex === ' ' ? 'Space' : wordForCurrentIndex,
                });

                errors.value.push({
                    attempted: event.key,
                    expected: currentChar.value,
                    word: wordForCurrentIndex === ' ' ? 'Space' : wordForCurrentIndex,
                });

                hasMistake.value = true;  // Set the flag to true to indicate that a mistake has been made
            }

            store.incrementKeystrokes();
            console.log("Total Keystrokes:", store.totalKeystrokes);

            if (event.ctrlKey && event.key === 'Backspace') {
                deleteLastWord();
            } else if (event.key === 'Backspace') {
                deleteLastChar();
            } else {
                typeChar(event.key);
            }
        }
        const wordForCurrentChar = indexToWordMapping[store.currentIndex];
        console.log("Current Word:", wordForCurrentChar);
    }

    function resetHasMistake() {
        hasMistake.value = false;
    }

    // Variables for index tracking
    const wordsPerSecond = ref<string[][]>([]);
    let previousIndex = ref(0);
    let indexInterval: number | null = null;

    // Function to start tracking index per second
    function startIndexTracking() {
        const store = useStore();
        try {
            indexInterval = setInterval(() => {
                console.log("Starting index tracking");

                // Get the current index from the typing handler
                const currentIndexValue = store.currentIndex;

                // Record the words typed in this second
                const startIdx = previousIndex.value;
                const endIdx = store.currentIndex;
                const wordsThisSecond: string[] = [];

                for (let i = startIdx; i < endIdx; i++) {
                    const word = indexToWordMapping[i];
                    if (word && !wordsThisSecond.includes(word)) {
                        wordsThisSecond.push(word);
                    }
                    console.log("Word inside index traching:", word);
                }

                wordsPerSecond.value.push(wordsThisSecond);
                store.updateWordsPerSecond(wordsThisSecond);

                // Update the previous index for the next iteration
                previousIndex.value = currentIndexValue;

            }, 1000) as unknown as number;
        } catch (e) {
            console.error("Error while starting index tracking:", e);
        }
    }


    // Function to stop tracking index per second
    function stopIndexTracking() {
        try {
            if (indexInterval) {
                clearInterval(indexInterval);
                indexInterval = null;
            }
            previousIndex.value = 0;
            console.log("Last index:", store.currentIndex);  // Log words per second
        } catch (e) {
            console.error("Error while stopping index tracking:", e);
        }
    }

    // handles deleting characters for determining current index
    function deleteLastChar() {

        console.log("Calling deleteLastChar")
        if (store.currentIndex > 0) {
            store.currentIndex -= 1;
            store.typedIndices.pop();
            store.uniqueCorrectIndices[store.currentIndex] = false;
            updateScrollPosition(scrollContainer);
        }
        // Now, check if there are any remaining mistakes
        const remainingMistakes = store.typedIndices.some(index => {
            return store.typed[index] !== fetchedText.value.charAt(index);
        });

        // If there are no remaining mistakes, then set hasMistake to false
        hasMistake.value = remainingMistakes;
    }

    // Allows deleting last word for shortcut Ctrl + Backspace
    function deleteLastWord() {
        console.log("Calling deleteLastWord")
        // If the current character is a space, delete it and return
        if (store.currentIndex > 0 && fetchedText.value.charAt(store.currentIndex - 1) === " ") {
            deleteLastChar();
            return; // Exit the function after deleting the space
        }

        // Delete characters until the next space is found or the start is reached
        while (store.currentIndex > 0 && fetchedText.value.charAt(store.currentIndex - 1) !== " ") {
            deleteLastChar();
        }
    }

    // handles player input and determines correct and incorrect keystrokes
    function typeChar(char: string) {
        console.log("Calling typeChar");
        store.typed[store.currentIndex] = char; // Update the typed dictionary

        // Record the expected character to totalOccurrences
        if (store.currentIndex < fetchedText.value.length) {
            const expectedChar = fetchedText.value[store.currentIndex].toLowerCase();
            totalOccurrences.value[expectedChar] = (totalOccurrences.value[expectedChar] || 0) + 1;

            if (char === fetchedText.value[store.currentIndex]) {
                store.incrementCorrectKeystrokes();
                store.uniqueCorrectIndices[store.currentIndex] = true; // needed to assess current progress (indices correctly typed/total indices for text)
            } else {
                mistakesMade.value[expectedChar] = (mistakesMade.value[expectedChar] || 0) + 1;
                store.uniqueCorrectIndices[store.currentIndex] = false; // needed to assess current progress (indices correctly typed/total indices for text)
            }


            store.typedIndices.push(store.currentIndex); // Add the currentIndex to typedIndices
            store.currentIndex += 1;
        }
        console.log("Current Index:", store.currentIndex);

        if (store.currentIndex === fetchedText.value.length) {
            if (noEndWithoutCorrection?.value) {
                if (currentProgress?.value === 100) {
                    onTypingEnd();  // *NOTE* same function as below, so no need
                }
                // Do nothing if progress is not 100%
            } else {
                onTypingEnd();  // Existing callback when typing is finished for single player
            }
        }

        updateScrollPosition(scrollContainer); // handle scrolling while player types
    }

    // Removing input listener at game end
    function removeKeyDownListener() {
        window.removeEventListener("keydown", handleKeyDown);
    }

    //detection for capslock overlay
    function detectCapsLock(event: KeyboardEvent) {
        console.log("Calling detectCapslock");
        store.isCapsLockOn = event.getModifierState('CapsLock');
    }

    onMounted(() => {
        window.addEventListener('keydown', detectCapsLock);
        window.addEventListener('keyup', detectCapsLock);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', detectCapsLock);
        window.removeEventListener('keyup', detectCapsLock);
    });

    return {
        accuracy,
        totalOccurrences,
        mistakesMade,
        removeKeyDownListener,
        detectCapsLock,
        handleKeyDown,
        deleteLastChar,
        deleteLastWord,
        typeChar,
        startIndexTracking,
        stopIndexTracking,
        wordsPerSecond,
        resetHasMistake,
        hasMistake,
    };
}

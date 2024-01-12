import { ref, computed, watch, nextTick } from "vue";
import type { Ref, ComponentPublicInstance } from 'vue';
import { useStore } from "../stores/store";
import { supabase } from "../supabase";
import { generateTrainingWords, trainingWords } from './TrainingHandler';  // Add this import, adjust the path as needed
import { allTimeSlowWords, loadAllTimeSlowWords } from './UserStatisticsCalculations';



export function useUtilities() {

    console.log("Calling useUtilities");
    const store = useStore();

    // Function to fetch texts from the database (longer texts for campaign, not words)
    async function fetchDataFromDB(table: string, column?: string) {
        const selectedColumn = column || "*";
        const { data, error } = await supabase
            .from(table)
            .select(selectedColumn)
            .order("id", { ascending: true });
        if (error) {
            console.error(`Error fetching data from ${table}:`, error);
            return null;
        }
        return data;
    }


    // Text Management Hook
    //*NOTE* remove performance variables and measurement in production
    // Can fetch words or texts (latter used in campaigns)
    // Currently minimum word length fixed to 3 characters
    function useTextManagement(mode: 'text' | 'words' | 'random' | 'single' | 'keys' | 'custom', wordLength?: '3') {
        console.log("Calling useTextManagement");
        const fetchedText = ref<string>("");

        // 1. fetches (a) random texts for campaign or (b) 50 words based on randomly generated index for training
        async function fetchText(numberOfWords: number, selectedKeys?: string[]): Promise<string[]> {
            return new Promise(async (resolve, reject) => {
                try {
                    const t0 = performance.now();  // Overall start time

                    if (mode === 'text') {
                        const t1 = performance.now();  // Start time for fetching texts
                        const texts = await fetchDataFromDB('texts');
                        if (texts) {
                            const randomIndex = Math.floor(Math.random() * texts.length);
                            fetchedText.value = (texts[randomIndex] as any).text;
                            console.log("Text fetched:", fetchedText.value);
                            store.loading = false;
                            store.setupUniqueCorrectIndices(fetchedText.value.length);
                        } else {
                            console.error('Text still not generated.');
                        }
                        const t2 = performance.now();  // End time for fetching texts
                        console.log(`Time taken for fetching texts: ${t2 - t1} milliseconds.`);
                    } else if (mode === 'words') {
                        const t1 = performance.now(); //*NOTE* can be removed
                        if (allTimeSlowWords.value.length === 0) {
                            console.log("allTimeSlowWords is empty, loading data...");
                            await loadAllTimeSlowWords(store.userSession); // *NOTE* check if user session correctly handled
                            console.log("Data loaded for allTimeSlowWords:", allTimeSlowWords.value);
                        }
                        await generateTrainingWords();  // Generate the training words here
                        if (trainingWords.value.length > 0) {
                            fetchedText.value = trainingWords.value.join(' ');
                            console.log("Training words generated");
                            store.loading = false;
                            store.setupUniqueCorrectIndices(fetchedText.value.length);
                        } else {
                            console.error('Training words are still not generated.');
                        }
                        const t2 = performance.now();  // End time for fetching words and generating training words
                        console.log(`Time taken for fetching words and generating training words: ${t2 - t1} milliseconds.`);
                    } else if (mode === 'random' || mode === 'single') {
                        const t1 = performance.now(); //*NOTE* can be removed
                        const words = await fetchDataFromDB('words', '3_letters');
                        if (words) {
                            const wordListFromDB = words.map((item: any) => item['3_letters']);
                            const randomWords = getRandomWords(wordListFromDB, numberOfWords);
                            fetchedText.value = randomWords.join(' ');
                            store.setupUniqueCorrectIndices(fetchedText.value.length);
                            store.loading = false;
                        }
                        const t2 = performance.now();  // End time for fetching random words
                        console.log(`Time taken for fetching random words: ${t2 - t1} milliseconds.`);
                    } else if (mode === 'keys' && selectedKeys) {
                        const generatedWords = [];
                        for (let i = 0; i < numberOfWords; i++) {
                            const wordLength = getRandomInt(3, 8); // Random word length between 3 and 7
                            let word = '';
                            for (let j = 0; j < wordLength; j++) {
                                const randomKey = selectedKeys[getRandomInt(0, selectedKeys.length)];
                                word += randomKey;
                            }
                            generatedWords.push(word);
                        }
                        fetchedText.value = generatedWords.join(' ');
                        store.setupUniqueCorrectIndices(fetchedText.value.length);
                        store.loading = false;
                    } else if (mode === 'custom') {
                        const customText = localStorage.getItem("customText") || '';
                        fetchedText.value = customText;
                        store.setupUniqueCorrectIndices(fetchedText.value.length);
                        store.loading = false;
                    }
                    const t3 = performance.now();//*NOTE* can be removed
                    if (store.randomizationEnabled && (mode === 'words' || mode === 'random' || mode === 'single' || mode === 'keys')) {
                        // Apply random capitalization
                        fetchedText.value = fetchedText.value
                            .split(' ')
                            .map(word => {
                                if (Math.random() < 0.4) { // 40% chance to capitalize
                                    return capitalizeFirstLetter(word);
                                }
                                return word;
                            })
                            .join(' ');

                        // Apply random punctuation
                        fetchedText.value = fetchedText.value
                            .split(' ')
                            .map(word => {
                                if (Math.random() < 0.2) { // 20% chance to add punctuation
                                    return addRandomPunctuation(word);
                                }
                                return word;
                            })
                            .join(' ');
                    }
                    const t4 = performance.now();  // End time for text randomization
                    console.log(`Time taken for text randomization: ${t4 - t3} milliseconds.`);

                    const tEnd = performance.now();  // Overall end time
                    console.log(`Total time taken for fetchText: ${tEnd - t0} milliseconds.`);

                    resolve(fetchedText.value.split(' '));
                } catch (error) {
                    reject(error);
                }
            });
        }

        // 2. text is split into characters to allow handling of input, error checking, scrolling, etc. logic
        const chars = computed(() => fetchedText.value.split(""));

        return {
            fetchedText,
            chars,
            fetchText
        };

    }

    // Additional utility function to get random words
    function getRandomWords(wordList: string[], numWords: number): string[] {
        const randomWords: string[] = [];

        for (let i = 0; i < numWords; i++) {
            const randomIndex = Math.floor(Math.random() * wordList.length);
            randomWords.push(wordList[randomIndex]);
        }

        return randomWords;
    }

    // Helper function to get a random integer between min (inclusive) and max (exclusive)
    function getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) + min);
    }

    // Helper function to capitalize the first letter of a string
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Helper function to add a random punctuation after a word
    function addRandomPunctuation(word: string) {
        const punctuations = [',', '.', ':', ';', '-', '?', '!', '"', ''];
        const randomIndex = Math.floor(Math.random() * punctuations.length);
        return word + punctuations[randomIndex];
    }


    // Handles chevron animation behavior
    // Position of chevron is based on current character position in DOM (can be calculated given fixed line height and rendering information from browser)
    // Resizing window currently does not update position and correct positioning after resize requires an input
    // Chevron has slight delay added to provide smooth transition (trade-off: at very high WPM speeds slight delay visible)
    // Interacts with CSS styling of chevron div in components
    function useChevronAnimation(
        charSpans: Ref<(Element | ComponentPublicInstance)[]>,
        chevronTop: Ref<number>,
        chevronLeft: Ref<number>,
    ) {
        console.log("Calling useChevronAnimation");
        let animationFrameId: number | null = null;
        let startingTime: number | null = null;

        const watchedCurrentIndex = computed(() => store.currentIndex);

        watch(watchedCurrentIndex, (newIndex) => {
            console.log("Calling watch chevron, new index", newIndex, "charSpans length", charSpans.value.length);
            nextTick().then(() => {
                // Cancel any ongoing animation
                if (animationFrameId !== null) {
                    cancelAnimationFrame(animationFrameId);
                }

                if (newIndex === charSpans.value.length) {
                    // Handle the case when the last character is typed
                    moveChevronToEndOfText(chevronTop, chevronLeft, charSpans);
                    console.log("Last character, moving chevron to:", chevronTop, chevronLeft)
                    return;
                }

                if (newIndex > charSpans.value.length) {
                    console.warn("New index is out of bounds: ", newIndex);
                    return; // Early return if newIndex is out of bounds
                }

                // Null check added here
                const textBoxElement = document.getElementById("speed-text");
                if (textBoxElement) {
                    const textBoxRect = textBoxElement.getBoundingClientRect();

                    const span = charSpans.value[newIndex];
                    if (span instanceof HTMLElement) {
                        // relative positioning based on bounding div and relative positioning of span of current character index within the bounding div
                        const spanRect = span.getBoundingClientRect();
                        if (spanRect.width === 0 || spanRect.height === 0) {
                            console.warn("Span rect is collapsed or invisible for index: ", newIndex);
                            return; // Skip if spanRect is collapsed or invisible
                        }

                        const newTop = spanRect.top - textBoxRect.top; // *NOTE* sometimes reaching the end of the text, spanRect.top and spanRect.left seem to turn to 0 erroneously and newTop and newLeft turn to negative numbers
                        const newLeft = spanRect.left - textBoxRect.left; // *NOTE* could be that at some instances the character defaults to none (beyond last) and then spanRect defaults to none

                        const currentTop = chevronTop.value;
                        const currentLeft = chevronLeft.value;

                        startingTime = null;

                        // time of animated progression of chevron to next character
                        const animate = (time: number) => {
                            if (store.startTime === null) startingTime = time;

                            const progress = (time - startingTime!) / 100; // 100ms animation duration

                            if (progress < 1) {
                                chevronTop.value = currentTop + progress * (newTop - currentTop);
                                chevronLeft.value =
                                    currentLeft + progress * (newLeft - currentLeft);
                                animationFrameId = requestAnimationFrame(animate);
                            } else {
                                chevronTop.value = newTop;
                                chevronLeft.value = newLeft;
                            }
                        };

                        console.log("Animating from (Top, Left):", currentTop, currentLeft, "to (Top, Left):", newTop, newLeft);
                        console.log("New Top and Left:", newTop, newLeft);
                        console.log("Current Top and Left:", currentTop, currentLeft);
                        console.log('Span Rect:', spanRect);
                        console.log('Text Box Rect:', textBoxRect);

                        animationFrameId = requestAnimationFrame(animate);
                    }
                }
            });
        });
        return { chevronTop, chevronLeft };
    }

    function moveChevronToEndOfText(chevronTop: Ref<number>, chevronLeft: Ref<number>, charSpans: Ref<(Element | ComponentPublicInstance)[]>) {
        const lastSpanIndex = charSpans.value.length - 1;
        const textBoxElement = document.getElementById("speed-text");

        if (textBoxElement && lastSpanIndex >= 0) {
            const textBoxRect = textBoxElement.getBoundingClientRect();
            const lastSpan = charSpans.value[lastSpanIndex];

            if (lastSpan instanceof HTMLElement) {
                const spanRect = lastSpan.getBoundingClientRect();
                chevronTop.value = spanRect.top - textBoxRect.top;
                chevronLeft.value = spanRect.right - textBoxRect.left; // Position to the right of the last character
            }
        }
    }

    function resetChevronPosition(chevronTop: Ref<number>, chevronLeft: Ref<number>) {
        const textBoxElement = document.getElementById("speed-text");
        console.log("Calling standalone resetChevronPosition");
        // important for relative chevron postion to adjust - scroll box again back to top, then no potential negative top margin is applied
        if (textBoxElement) {
            textBoxElement.scrollTop = 0;
        }
        chevronTop.value = 0;
        chevronLeft.value = 0;
    }

    // calculating time elapsed for test
    function useTimeDifference() {
        console.log("Calling useTimeDifference")

        return computed(() => {
            if (store.endTime && store.startTime !== null) {
                const timeElapsed = store.endTime.getTime() - store.startTime.getTime();
                //update total time played for statistics
                store.totalTimePlayed += timeElapsed;

                const minutes = Math.floor(timeElapsed / 1000 / 60);
                const seconds = Math.floor((timeElapsed / 1000) % 60);
                const formattedMinutes = String(minutes).padStart(2, "0");
                const formattedSeconds = String(seconds).padStart(2, "0");
                return `${formattedMinutes}m ${formattedSeconds}s`;
            } else {
                console.log("Error returning time elapsed.");
                return "00m 00s";
            }
        });
    }

    // function to create WPM and accuracy bucket data

    // Define WPM bucket ranges
    const wpmBucketRanges = Array.from({ length: 20 }, (_, i) => 10 * i);

    // Define accuracy bucket ranges
    const accuracyBucketIncrements = 2.5; // Increment by 2.5%
    const accuracyBucketRanges = Array.from({ length: 20 }, (_, i) => 50 + i * accuracyBucketIncrements);

    // Function to find the bucket index for a value
    function findBucketIndex(value: number, bucketRanges: number[]): number {
        let bucketIndex = bucketRanges.findIndex((br) => value < br) - 1;
        return bucketIndex >= 0 ? bucketIndex : bucketRanges.length - 1; // Ensure it falls within the last bucket if it exceeds all ranges
    }

    // Functions for WPM and Accuracy bucket determination
    function getWpmBucketIndex(wpm: number): number {
        return findBucketIndex(wpm, wpmBucketRanges);
    }

    function getAccuracyBucketIndex(accuracy: number): number {
        return findBucketIndex(accuracy, accuracyBucketRanges);
    }


    // function to save selected total statistics for all players
    async function saveTotalTimePlayed() {
        let gamesPlayed = 0;
        let totalTimePlayed = 0;
        let timeElapsed = 0;  // Initialize timeElapsed variable

        // Calculate timeElapsed for the current game
        if (store.endTime && store.startTime !== null) {
            timeElapsed = store.endTime.getTime() - store.startTime.getTime();
        }

        // Assume last game stats are the last element in userStats array
        const lastGameStats = store.userStats[store.userStats.length - 1];
        const wpmBucketIndex = getWpmBucketIndex(lastGameStats.wpm);
        const grossWpmBucketIndex = getWpmBucketIndex(lastGameStats.grossWPM);
        const accuracyBucketIndex = getAccuracyBucketIndex(lastGameStats.accuracy);


        // Fetch the latest data based on login status
        if (store.userSession && store.userSession.user) {
            const userId = store.userSession.user.id;

            // Fetch from database
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('games_played, time_played')
                .eq('id', userId)
                .single();

            if (fetchError) {
                console.error('Error fetching latest data:', fetchError);
            }

            if (data) {
                gamesPlayed = data.games_played || 0;
                totalTimePlayed = data.time_played || 0;
            }
        } else {
            // Fetch from localStorage
            const storedGamesPlayed = localStorage.getItem("gamesPlayed");
            const storedTotalTimePlayed = localStorage.getItem("totalTimePlayed");

            gamesPlayed = storedGamesPlayed ? parseInt(storedGamesPlayed, 10) : 0;
            totalTimePlayed = storedTotalTimePlayed ? parseInt(storedTotalTimePlayed, 10) : 0;
        }

        // Increment the counters
        gamesPlayed++;
        totalTimePlayed += timeElapsed;  // Update to add only the timeElapsed for this game

        // Update the total_time and total_count in the total_games table
        try {
            // Fetch the current total time, count, and buckets from total_games table
            let { data: totalData, error: totalError } = await supabase
                .from('total_games')
                .select('total_time, total_count, wpmbuckets, accuracybuckets, grosswpmbuckets')
                .single();

            if (totalError) throw totalError;

            // Ensure totalData is not null
            if (totalData) {
                // Increment total time and count
                let newTotalTime = totalData.total_time + timeElapsed;
                let newTotalCount = totalData.total_count + 1;

                // Increment the correct buckets
                const updatedWpmBuckets = [...totalData.wpmbuckets];
                const updatedGrossWpmBuckets = [...(totalData.grosswpmbuckets || new Array(20).fill(0))];
                const updatedAccuracyBuckets = [...totalData.accuracybuckets];

                updatedWpmBuckets[wpmBucketIndex] = (updatedWpmBuckets[wpmBucketIndex] || 0) + 1;
                updatedGrossWpmBuckets[grossWpmBucketIndex] = (updatedGrossWpmBuckets[grossWpmBucketIndex] || 0) + 1;
                updatedAccuracyBuckets[accuracyBucketIndex] = (updatedAccuracyBuckets[accuracyBucketIndex] || 0) + 1;

                // Update the total_games table with new total time, count, and buckets
                const { error: updateTimeError } = await supabase
                    .from('total_games')
                    .update({
                        total_time: newTotalTime,
                        total_count: newTotalCount,
                        wpmbuckets: updatedWpmBuckets,
                        grosswpmbuckets: updatedGrossWpmBuckets,
                        accuracybuckets: updatedAccuracyBuckets
                    })
                    .eq('id', 1);  // Adjust as needed based on your table's structure

                if (updateTimeError) throw updateTimeError;
            } else {
                console.error("No total time, count, or bucket data found to update.");
                // Handle scenario where there's no total data, possibly initialize a new row if needed
            }
        } catch (error) {
            console.error("Error updating total time, count, or buckets:", error);
        }

        // Save the updated values
        if (store.userSession && store.userSession.user) {
            return // handled in saveStats function in UserStatisticsHandler
        } else {
            localStorage.setItem("totalTimePlayed", totalTimePlayed.toString());
            localStorage.setItem("gamesPlayed", gamesPlayed.toString());
        }

        // Update the store with the new values
        store.numberOfGamesPlayed = gamesPlayed;
        store.totalTimePlayed = totalTimePlayed;
    }



    return {
        useTextManagement,
        getRandomWords,
        useChevronAnimation,
        resetChevronPosition,
        useTimeDifference,
        saveTotalTimePlayed,
        fetchDataFromDB,
    };
}

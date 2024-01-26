import { ref, computed } from "vue";
import { useStore } from "../stores/store";
import { supabase } from "../supabase";
import { generateTrainingWords, trainingWords } from './TrainingHandler';  // Add this import, adjust the path as needed
import { allTimeSlowWords, loadAllTimeSlowWords } from './UserStatisticsCalculations';



export function useUtilities() {
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
    // Can fetch words or texts depending on training mode or campaign
    // Currently minimum word length fixed to 3 characters
    function useTextManagement(mode: 'text' | 'words' | 'random' | 'single' | 'keys' | 'custom', wordLength?: '3') {
        const fetchedText = ref<string>("");

        // 1. fetches (a) random texts for campaign or (b) a set number of words based on randomly generated index for training
        async function fetchText(numberOfWords: number, selectedKeys?: string[]): Promise<string[]> {
            return new Promise(async (resolve, reject) => {
                try {

                    if (mode === 'text') {
                        const texts = await fetchDataFromDB('texts');
                        if (texts) {
                            const randomIndex = Math.floor(Math.random() * texts.length);
                            fetchedText.value = (texts[randomIndex] as any).text;
                            store.loading = false;
                            store.setupUniqueCorrectIndices(fetchedText.value.length);
                        } else {
                            console.error('Text still not generated.');
                        }
                    } else if (mode === 'words') {
                        if (allTimeSlowWords.value.length === 0) {
                            await loadAllTimeSlowWords(store.userSession); // *NOTE* check if user session correctly handled
                        }
                        await generateTrainingWords();  // Generate the training words here
                        if (trainingWords.value.length > 0) {
                            fetchedText.value = trainingWords.value.join(' ');
                            store.loading = false;
                            store.setupUniqueCorrectIndices(fetchedText.value.length);
                        } else {
                            console.error('Training words are still not generated.');
                        }
                    } else if (mode === 'random' || mode === 'single') {
                        const words = await fetchDataFromDB('words', '3_letters');
                        if (words) {
                            const wordListFromDB = words.map((item: any) => item['3_letters']);
                            const randomWords = getRandomWords(wordListFromDB, numberOfWords);
                            fetchedText.value = randomWords.join(' ');
                            store.setupUniqueCorrectIndices(fetchedText.value.length);
                            store.loading = false;
                        }
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

    // Helper functions
    function getRandomWords(wordList: string[], numWords: number): string[] {
        const randomWords: string[] = [];

        for (let i = 0; i < numWords; i++) {
            const randomIndex = Math.floor(Math.random() * wordList.length);
            randomWords.push(wordList[randomIndex]);
        }

        return randomWords;
    }

    function getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) + min);
    }

    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function addRandomPunctuation(word: string) {
        const punctuations = [',', '.', ':', ';', '-', '?', '!', '"', ''];
        const randomIndex = Math.floor(Math.random() * punctuations.length);
        return word + punctuations[randomIndex];
    }

    // calculating time elapsed for finishing game
    function useTimeDifference() {

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
                //console.warn("Error returning time elapsed."); note triggers at beginning of game
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

    // Additional statistics------------------------------------------------------------------------------------------------
    // includes statistics on total time and games played by user as well as histogram data on all-time WPM and accuracy (detailed values in stats only for last 100 games stored)

    async function saveTotalTimePlayed() {
        let timeElapsed = 0;  // Initialize timeElapsed variable

        // Calculate timeElapsed for the current game
        if (store.endTime && store.startTime !== null) {
            timeElapsed = store.endTime.getTime() - store.startTime.getTime();
        }

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

                // Check if wpm, grossWPM, and accuracy have values (then wpm and accuracy statistics are not saved in total stats)
                // this applies to certain game modes that do not save statistics (single word training, etc.) as well as cases where accuracy is <50%
                // time played and play count is always done
                const lastGameStats = store.userStats.length > 0 ? store.userStats[store.userStats.length - 1] : null;
                if (lastGameStats && lastGameStats.wpm !== undefined && lastGameStats.grossWPM !== undefined && lastGameStats.accuracy !== undefined) {
                    // define buckets for total site stats
                    const wpmBucketIndex = getWpmBucketIndex(lastGameStats.wpm);
                    const grossWpmBucketIndex = getWpmBucketIndex(lastGameStats.grossWPM);
                    const accuracyBucketIndex = getAccuracyBucketIndex(lastGameStats.accuracy);

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
                    // If no wpm data due to game mode, update the total_games table with new total time and count, but not the buckets
                    const { error: updateTimeError } = await supabase
                        .from('total_games')
                        .update({
                            total_time: newTotalTime,
                            total_count: newTotalCount
                            // Buckets are not updated
                        })
                        .eq('id', 1);  // Adjust as needed based on your table's structure

                    if (updateTimeError) throw updateTimeError;
                }

            } else {
                console.error("No total time, count, or bucket data found to update.");
                // Handle scenario where there's no total data, possibly initialize a new row if needed
            }
        } catch (error) {
            console.error("Error updating total time, count, or buckets:", error);
        }

        if (store.userSession && store.userSession.user) {
            return; // handled in saveStats function in UserStatisticsHandler
        } else {
            // Handle guest users
            let currentGamesPlayed = parseInt(localStorage.getItem("gamesPlayed") || "0");
            let currentTotalTimePlayed = parseInt(localStorage.getItem("totalTimePlayed") || "0");

            currentGamesPlayed += 1;
            currentTotalTimePlayed += timeElapsed;

            localStorage.setItem("totalTimePlayed", currentTotalTimePlayed.toString());
            localStorage.setItem("gamesPlayed", currentGamesPlayed.toString());

            // Update the store with the new values
            store.numberOfGamesPlayed = currentGamesPlayed;
            store.totalTimePlayed = currentTotalTimePlayed;
        }
    }

    return {
        useTextManagement,
        getRandomWords,
        useTimeDifference,
        saveTotalTimePlayed,
        fetchDataFromDB,
    };
}

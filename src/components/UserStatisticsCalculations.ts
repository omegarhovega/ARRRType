import { ref, computed } from "vue";
import type { Ref } from "vue";
import { useStore } from "../stores/store";
import { supabase } from "../supabase";


// 1. WPM and Accuracy Statistics ----------------------------------------------------------------------------------------------------------------------------
// Calculate last round average WPM (based on correct keystrokes from Pinia store, assumes average word length of 5 characters) -> uses Pinia Store
// inputs: Total time passed

// statistics used for end of round overlay *NOTE* potentially directly do in end game watch function
export const wpm = computed(() => {
    const store = useStore();
    // Debugging line
    console.log("Start Time:", store.startTime, "End Time:", store.endTime);
    if (store.endTime && store.startTime !== null) {
        const wpmValue = calculateWPM(
            store.endTime.getTime() - store.startTime.getTime()
        );
        // Debugging line
        console.log("Calculated WPM:", wpmValue);
        return wpmValue;
    } else {
        return 0;
    }
});

export const grossWpm = computed(() => {
    const store = useStore();
    // Only calculate WPM if the game is finished
    if (store.endTime && store.startTime !== null) {
        return calculateGrossWPM(
            store.endTime.getTime() - store.startTime.getTime()
        );
    } else {
        return 0;
    }
});

export function calculateWPM(totalTime: number): number {
    const store = useStore();
    // Debugging line
    console.log("Total Time in calculateWPM:", totalTime, "Correct Keystrokes:", store.correctKeystrokes);
    const wpm = Math.floor(store.correctKeystrokes / 5 / (totalTime / (60 * 1000)));
    // Debugging line
    console.log("WPM in calculateWPM:", wpm);
    return wpm;
}

// Calculate last round average Gross WPM (based on total keystrokes from Pinia store, assumes average word length of 5 characters) -> uses Pinia Store
// inputs: Total time passed
export function calculateGrossWPM(totalTime: number): number {
    const store = useStore();
    // Debugging line
    console.log("Total Time in calculateGrossWPM:", totalTime, "Correct Keystrokes:", store.correctKeystrokes);
    const grossWpm = Math.floor(store.totalKeystrokes / 5 / (totalTime / (60 * 1000)));
    // Debugging line
    console.log("grossWPM in calculateGrossWPM:", grossWpm);
    return grossWpm
}

export const wpmPerSecond: Ref<number[]> = ref([]);
export const grossWpmPerSecond: Ref<number[]> = ref([]);
export const previousKeystrokes: Ref<number> = ref(0);
export const previousCorrectKeystrokes: Ref<number> = ref(0);
export let interval: number | null = null;

// start WPM per second tracking for round -> uses Pinia Store
export function startWpmTracking() {
    try {
        console.log("Starting WPM tracking")
        interval = setInterval(() => {
            const store = useStore();
            console.log("Store data at each second:", store);
            // Calculate WPM per second based on correct keystrokes in interval
            const wpmForSecond = ((store.correctKeystrokes - previousCorrectKeystrokes.value) / 5) * 60;
            console.log("correctKeystrokes", store.correctKeystrokes, "previouscorrectKeystrokes", previousCorrectKeystrokes.value)
            // Calculate Gross WPM per second based on total keystrokes in interval
            const grossWpmForSecond = ((store.totalKeystrokes - previousKeystrokes.value) / 5) * 60;
            console.log("totalKeystrokes", store.totalKeystrokes, "previousKeystrokes", previousKeystrokes.value)
            // Update arrays
            wpmPerSecond.value.push(wpmForSecond);
            grossWpmPerSecond.value.push(grossWpmForSecond);

            // Update the previous keystrokes for the next iteration
            previousCorrectKeystrokes.value = store.correctKeystrokes;
            previousKeystrokes.value = store.totalKeystrokes;
            console.log("WPM per second:", wpmPerSecond.value);

        }, 1000) as unknown as number;
    } catch (e) {
        console.error("Error while starting WPM Tracking:", e);
    }
}

// stop WPM per second tracking for round, called after round to ensure that it is reset before next -> uses Pinia Store
export function stopWpmTracking() {
    const store = useStore();
    try {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        previousKeystrokes.value = 0; // resets between each round
        previousCorrectKeystrokes.value = 0; // resets between each round
        console.log("stopping WPM per second tracking", wpmPerSecond.value, grossWpmPerSecond.value)
        console.log("Value of userStats in stopWpmTracking:", store.userStats);
    } catch (e) {
        console.error("Error while stopping WPM Tracking:", e);
    }
}

// calculate accuracy per second for last round using logged gross/net wpm tracking data
export const accuracyPerSecond = computed(() => {
    console.log("Calculating accuracyPerSecond")
    const accuracies: number[] = [];  // Explicitly specify the type
    for (let i = 0; i < wpmPerSecond.value.length; i++) {
        const wpm = wpmPerSecond.value[i];
        const grossWpm = grossWpmPerSecond.value[i];
        if (grossWpm === 0) {
            accuracies.push(0); // Handle division by zero
        } else {
            const accuracy = (wpm / grossWpm) * 100;
            accuracies.push(accuracy);
        }
    }
    return accuracies;
});

// When called, what values, correct values?, when cleared


// 2. Mistyped Words -----------------------------------------------------------------------------------------------------------------------------------------

export const historicalWordErrors = ref<{ [key: string]: number }>({});

// all-time mistyped words from local or database storage (should be called after userStats is populated with historical data after retrieveStats() call) -> uses Pinia Store
export const topMistypedWords = computed(() => {
    const store = useStore();
    console.log("Computing topMistypedWords with userStats:", store.userStats);

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

            // Log unique error words for the current round
            console.log("Unique error words for round ID " + stat.id + ":", Array.from(uniqueErrorWords));

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

    // Log the historical wordErrors
    console.log("Historical wordErrors:", historicalWordErrors.value);

    return Object.entries(historicalWordErrors.value)
        .sort(([, aFreq], [, bFreq]) => bFreq - aFreq)
        .slice(0, 13)
        .map(([text, frequency]) => ({ text, frequency }));
});

// last round mistyped words -> uses Pinia Store
export const lastRoundMistypedWords = computed(() => {
    const store = useStore();
    const lastRound = store.userStats[store.userStats.length - 1];
    if (!lastRound || !lastRound.errors) return [];

    const uniqueWords = new Set<string>();
    console.log("Unique words set:", uniqueWords);

    lastRound.errors.forEach(error => {
        // Check if the error word is not undefined, not empty, and is not a punctuation
        if (error.word && typeof error.word === 'string' && error.word.trim() && ![".", ",", "!", "?", ";", ":", "-", "(", ")", "[", "]", "{", "}", "<", ">", "\"", "'", "Space"].includes(error.word)) {
            uniqueWords.add(error.word);
        }
    });

    console.log("Unique words:", Array.from(uniqueWords));  // Debugging line
    return Array.from(uniqueWords);
});


// 3. Mistyped Characters ----------------------------------------------------------------------------------------------------------------------------------

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


// calculating last round error rates for heatmap -> uses Pinia Store
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

// Function to aggregate heatmap data for AllTimeStats -> uses Pinia Store
export function aggregateHeatmapData(): void {
    const store = useStore();
    console.log("Calling aggregateHeatmapData")
    try {
        // Reset aggregated data
        aggregatedData.value = {
            totalOccurrences: {},
            mistakesMade: {}
        };
        console.log("Aggregated Data Occ:", aggregatedData.value.totalOccurrences);
        console.log("Aggregated Data Mistakes:", aggregatedData.value.mistakesMade);

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

        console.log("Fetched heatmap:", aggregatedData.value);
    } catch (e) {
        console.error("Error while aggregating heatmap data:", e);
    }
}


// 4. Consistency Statistic ----------------------------------------------------------------------------------------------------------------------------------

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

export function calculateConsistency(): number {
    try {
        console.log("Calling calculateConsistency")
        if (wpmPerSecond.value.length === 0) return 0;  // Return a default value if the array is empty

        // *NOTE* mean wpm used for whole test (avoids impresicision caused by measuring WPMperSecond in intervals which discards partial inverval data)
        const squaredDifferences = wpmPerSecond.value.map(value => Math.pow(value - wpm.value, 2));
        console.log("Squared differences:", squaredDifferences);
        const sumOfSquaredDifferences = squaredDifferences.reduce((total, value) => total + value, 0);
        console.log("Sum of squared differences:", sumOfSquaredDifferences);
        const variance = sumOfSquaredDifferences / (wpmPerSecond.value.length - 1);
        console.log("Variance:", variance)
        const standardDeviation = Math.sqrt(variance);
        console.log("StDev:", standardDeviation)

        // Calculate the Coefficient of Variation (consistency)
        const relativeConsistency = (standardDeviation / wpm.value) * 100;
        console.log("Relative Cons.:", relativeConsistency)
        return relativeConsistency;
    } catch (e) {
        console.error("Error while calculating consistency", e);
        return 0;
    }
}


// 5. Identify Slow Words ----------------------------------------------------------------------------------------------------------------------------------

// *NOTE* not in use yet, should separate logic for logged in users and pull from supabase

// average last 100 rounds Wpm calculation for slow words definition -> uses local storage 
// average last 100 rounds Wpm calculation for slow words definition -> uses local storage or Supabase
export async function setAverageWpmLast100(userSession?: any): Promise<number> {
    console.log("Calling setAverageWpmLast100");
    let last100Stats: any[] = [];
    const store = useStore();
    console.log("UserSession, userId:", userSession);

    // If user is logged in
    if (userSession && userSession.user) {
        const userId = userSession.user.id;
        // Fetch stats from Supabase for the logged-in user
        const { data, error } = await supabase
            .from('user_stats')
            .select('wpm')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error("Error fetching stats from Supabase:", error);
            return 0;
        }

        last100Stats = data || [];
        console.log("Last 100 stats logged in:", last100Stats);
    }
    // If user is a guest
    else {
        const userStatsString = localStorage.getItem("userStats");
        if (!userStatsString) {
            console.log("No User Stats found in local storage.");
            return 0; // Handle the case where userStats is null
        }

        // Parse the stored JSON string to an object
        last100Stats = JSON.parse(userStatsString).slice(-100);
        console.log("Last 100 stats guest:", last100Stats);
    }

    if (last100Stats.length === 0) {
        return 0;
    }

    const totalWpm = last100Stats.reduce((acc, stat: any) => {
        return acc + stat.wpm;
    }, 0);

    console.log("Total WPM:", totalWpm);  // Removed .value

    const average = totalWpm / last100Stats.length;

    store.setAverageWpmLast100(average);
    console.log("Calculated Average WPM:", average);

    return average;
};



export const slowWords = ref<Array<{ word: string, wpm: number }>>([]);
export const uniqueSlowWords = ref(new Set<string>());
export const allTimeSlowWords = ref<Array<{ word: string, wpm: number }>>([]);

// Identify slow words -> uses Pinia Store
export function identifySlowWords(): void {
    const store = useStore();
    console.log("Calling identifySlowWords");
    // Clear the previous slow words array
    slowWords.value = [];

    // Debug: Log the initial state
    console.log('Initial slowWords:', slowWords.value);
    console.log('Initial uniqueSlowWords:', uniqueSlowWords.value); // still has a value after round when logging in after logging out

    // Use a Set to keep track of unique slow words
    uniqueSlowWords.value = new Set<string>(); // Clear the set
    console.log('Clearing initial uniqueSlowWords:', uniqueSlowWords)

    // Debug: Log data sources
    console.log('wpmPerSecond:', wpmPerSecond.value);
    console.log('store.wordsPerSecond:', store.wordsPerSecond);

    // Loop through each second
    for (let i = 0; i < store.wordsPerSecond.length; i++) {
        // Get the WPM for the current second
        const currentWpm = wpmPerSecond.value[i];

        const averageWpm = store.averageWpmLast100;
        // Debug: Log the current WPM and average WPM
        console.log(`currentWpm: ${currentWpm}, averageWpmLast100: ${store.averageWpmLast100}`);

        // Get the words typed in the current second
        const wordsInCurrentSecond = store.wordsPerSecond[i];


        // Loop through the words typed in the current second
        for (const word of wordsInCurrentSecond) {
            // If the WPM at which the word was typed is less than the long-term average and greater than or equal to 0, store it.
            if (currentWpm < averageWpm && currentWpm >= 0) {
                // Only add the word if it hasn't been added before
                if (!uniqueSlowWords.value.has(word)) {
                    slowWords.value.push({ word, wpm: currentWpm });
                    uniqueSlowWords.value.add(word);
                }
            }
        }
        // Debug: Log the final state
    }
    console.log('Final slowWords:', slowWords.value);
    console.log('Final uniqueSlowWords:', uniqueSlowWords.value);
    console.log("Identified slow words local storage:", localStorage.getItem("allTimeSlowWords"));
    console.log("Identified slow words value:", slowWords.value);
}

// Update all-time slow words *NOTE* need to pull allTimeSlowWords from local storage / supabase
export async function updateAllTimeSlowWords(userSession?: any): Promise<void> {
    let existingSlowWords: Array<{ word: string, wpm: number }> = [];
    console.log("slowWords before update in updateAllTimeSlowWords:", slowWords.value);

    // For logged-in users, fetch from Supabase
    if (userSession && userSession.user) {
        const userId = userSession.user.id;
        const { data, error } = await supabase
            .from('profiles')
            .select('100_slow_words')
            .eq('id', userId)
            .single();

        if (error) {
            console.error("Error fetching slow words from Supabase:", error);
            return;
        }

        // *NOTE DEBUG*
        if (data) {
            console.log("All data from Supabase:", data);
            if (data['100_slow_words'] === undefined) {
                console.log("100_slow_words is undefined in Supabase data");
            }
        }

        if (data && data['100_slow_words']) {
            existingSlowWords = data['100_slow_words'];
            console.log("Existing slow words looged in users in updateAllTimeSlowWords:", existingSlowWords)
        }
    }
    // For logged-out users, fetch from local storage
    else {
        const existingSlowWordsString = localStorage.getItem("allTimeSlowWords");
        if (existingSlowWordsString) {
            existingSlowWords = JSON.parse(existingSlowWordsString);
            console.log("Existing slow words guest users in updateAllTimeSlowWords:", existingSlowWords)
        }
    }

    allTimeSlowWords.value = [...existingSlowWords, ...slowWords.value];

    if (allTimeSlowWords.value.length > 100) {
        allTimeSlowWords.value = allTimeSlowWords.value.slice(-100);
    }
    console.log("Updated alltimeslowords:", allTimeSlowWords.value);

    console.log("slowWords after update in updateAllTimeSlowWords:", slowWords.value);
}


// Save all-time slow words
export async function saveAllTimeSlowWords(userSession?: any): Promise<void> {
    const userId = userSession && userSession.user ? userSession.user.id : null;

    // For logged-in users, save to Supabase
    if (userId) {
        return; // handled by saveStats function to  avoid separate writes to same table
    }
    // For guest users, save to local storage *NOTE* needs to take in new slow words and keep old ones
    else {
        localStorage.setItem("allTimeSlowWords", JSON.stringify(allTimeSlowWords.value));
        localStorage.setItem("lastSlowWords", JSON.stringify(slowWords.value));
    }
    //*NOTE* check if sequence is right
    slowWords.value = []; // reset slow words to empty
    allTimeSlowWords.value = [];

}

// Load all-time slow words
export async function loadAllTimeSlowWords(userSession?: any): Promise<void> {
    const userId = userSession && userSession.user ? userSession.user.id : null;

    // For logged-in users, load from Supabase
    if (userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('100_slow_words, last_slow_words')
            .eq('id', userId)
            .single();

        if (error) {
            console.error("Error loading slow words from Supabase:", error);
        } else {
            if (data && data['100_slow_words']) {
                allTimeSlowWords.value = data['100_slow_words'];
            }
            if (data && data['last_slow_words']) {
                slowWords.value = data['last_slow_words'];
            }
        }
    }
    // For guest users, load from local storage
    else {
        const savedAllTimeSlowWords = localStorage.getItem("allTimeSlowWords");
        const savedLastSlowWords = localStorage.getItem("lastSlowWords");

        if (savedAllTimeSlowWords) {
            allTimeSlowWords.value = JSON.parse(savedAllTimeSlowWords);
        }
        if (savedLastSlowWords) {
            slowWords.value = JSON.parse(savedLastSlowWords);
        }
    }
}

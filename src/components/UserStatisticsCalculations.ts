import { ref, computed } from "vue";
import type { Ref } from "vue";
import { useStore } from "../stores/store";
import { supabase } from "../supabase";


// 1. WPM and Accuracy Statistics ----------------------------------------------------------------------------------------------------------------------------
// basis for data in WPM and accuracy charts in stats overview

// statistics used for end of round overlay
export const wpm = computed(() => {
    const store = useStore();
    // Only calculate WPM if the game is finished
    if (store.endTime && store.startTime !== null) {
        const wpmValue = calculateWPM(
            store.endTime.getTime() - store.startTime.getTime()
        );
        return wpmValue;
    } else {
        return 0;
    }
});

export const grossWpm = computed(() => {
    const store = useStore();
    // Only calculate Gross WPM if the game is finished
    if (store.endTime && store.startTime !== null) {
        return calculateGrossWPM(
            store.endTime.getTime() - store.startTime.getTime()
        );
    } else {
        return 0;
    }
});

// Average WPM for whole game, assumes average word length of 5 characters
// WPM measures correct keystrokes per time used for text
export function calculateWPM(totalTime: number): number {
    const store = useStore();
    const wpm = Math.floor(store.correctKeystrokes / 5 / (totalTime / (60 * 1000)));
    return wpm;
}

// Average Gross WPM for whole game, assumes average word length of 5 characters
// Gross WPM measures total keystrokes (correct or incorrect) per time used for text
export function calculateGrossWPM(totalTime: number): number {
    const store = useStore();
    const grossWpm = Math.floor(store.totalKeystrokes / 5 / (totalTime / (60 * 1000)));
    return grossWpm
}

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


// 2. Mistyped Words -----------------------------------------------------------------------------------------------------------------------------------------
// basis for mistyped words display on stats overview

export const historicalWordErrors = ref<{ [key: string]: number }>({});

// all-time mistyped words from local or database storage (to be called after userStats is populated with historical data after retrieveStats() call)
export const topMistypedWords = computed(() => {
    const store = useStore();

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

    return Object.entries(historicalWordErrors.value)
        .sort(([, aFreq], [, bFreq]) => bFreq - aFreq)
        .slice(0, 13)
        .map(([text, frequency]) => ({ text, frequency }));
});

// last round mistyped words
export const lastRoundMistypedWords = computed(() => {
    const store = useStore();
    const lastRound = store.userStats[store.userStats.length - 1];
    if (!lastRound || !lastRound.errors) return [];

    const uniqueWords = new Set<string>();

    lastRound.errors.forEach(error => {
        // Check if the error word is not undefined, not empty, and is not a punctuation
        if (error.word && typeof error.word === 'string' && error.word.trim() && ![".", ",", "!", "?", ";", ":", "-", "(", ")", "[", "]", "{", "}", "<", ">", "\"", "'", "Space"].includes(error.word)) {
            uniqueWords.add(error.word);
        }
    });

    return Array.from(uniqueWords);
});


// 3. Mistyped Characters ----------------------------------------------------------------------------------------------------------------------------------
// basis for keyboard heatmap in stats overview

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


// 4. Consistency Statistic ----------------------------------------------------------------------------------------------------------------------------------
// claculates consitency figure for stats page

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


// 5. Identify Slow Words ----------------------------------------------------------------------------------------------------------------------------------
// identifies words that were typed slower than WPM average of user in last 100 games for training mode "Learn from Mistakes"

// average last 100 rounds Wpm calculation for slow words definition
export async function setAverageWpmLast100(userSession?: any): Promise<number> {
    let last100Stats: any[] = [];
    const store = useStore();

    // If user logged in
    if (userSession && userSession.user) {
        const userId = userSession.user.id;

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
    }
    // If user is guest
    else {
        const userStatsString = localStorage.getItem("userStats");
        if (!userStatsString) {
            return 0; // Handle the case where userStats is null
        }

        // Parse the stored JSON string to an object
        last100Stats = JSON.parse(userStatsString).slice(-100);
    }

    if (last100Stats.length === 0) {
        return 0;
    }

    const totalWpm = last100Stats.reduce((acc, stat: any) => {
        return acc + stat.wpm;
    }, 0);

    const average = totalWpm / last100Stats.length;

    store.setAverageWpmLast100(average);

    return average;
};

export const slowWords = ref<Array<{ word: string, wpm: number }>>([]);
export const uniqueSlowWords = ref(new Set<string>());
export const allTimeSlowWords = ref<Array<{ word: string, wpm: number }>>([]);

// Identify slow words based on last 100 games WPM average
export function identifySlowWords(): void {
    const store = useStore();
    // Clear the previous slow words array
    slowWords.value = [];

    // Use a Set to keep track of unique slow words
    uniqueSlowWords.value = new Set<string>(); // Clear the set

    // Loop through each second
    for (let i = 0; i < store.wordsPerSecond.length; i++) {
        // Get the WPM for the current second
        const currentWpm = wpmPerSecond.value[i];

        const averageWpm = store.averageWpmLast100;

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
    }
}

// Update all-time slow words
export async function updateAllTimeSlowWords(userSession?: any): Promise<void> {
    let existingSlowWords: Array<{ word: string, wpm: number }> = [];

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

        if (data && data['100_slow_words']) {
            existingSlowWords = data['100_slow_words'];
        }
    }
    // For logged-out users, fetch from local storage
    else {
        const existingSlowWordsString = localStorage.getItem("allTimeSlowWords");
        if (existingSlowWordsString) {
            existingSlowWords = JSON.parse(existingSlowWordsString);
        }
    }

    allTimeSlowWords.value = [...existingSlowWords, ...slowWords.value];

    if (allTimeSlowWords.value.length > 100) {
        allTimeSlowWords.value = allTimeSlowWords.value.slice(-100);
    }
}


// Save all-time slow words
export async function saveAllTimeSlowWords(userSession?: any): Promise<void> {
    const userId = userSession && userSession.user ? userSession.user.id : null;

    // For logged-in users
    if (userId) {
        return; // handled by saveStats function already, so no duplicate action here
    }
    // For guest users, save to local storage
    else {
        localStorage.setItem("allTimeSlowWords", JSON.stringify(allTimeSlowWords.value));
        localStorage.setItem("lastSlowWords", JSON.stringify(slowWords.value));
    }

    // reset slow words to empty
    slowWords.value = [];
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

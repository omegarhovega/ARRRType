import { ref } from "vue";
import { useStore } from "../../stores/store";
import { supabase } from "../../supabase";
import { wpmPerSecond } from "./WPMAccPerSecond";


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

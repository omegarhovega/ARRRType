import { ref } from 'vue';
import type { Ref } from 'vue';
import { supabase } from '../supabase';
import { useUserStatistics } from './UserStatistics';  // Assuming UserStatisticsCalculations is in the same directory
import { useStore } from "../stores/store";
import { topMistypedWords, allTimeSlowWords } from './UserStatisticsCalculations';


// This ref will hold the set of 50 training words
export const trainingWords: Ref<string[]> = ref([]);

// Function to generate training words based on mistyped characters
export async function generateTrainingWords() {
    const store = useStore();

    // to fill the array with error rates for characters, fetch the respective data from storage
    const { retrieveStats, resetStats, errorRates } =
        useUserStatistics();
    await retrieveStats() // note, this fills userStats which would later be used unchanged for the round end statistics - since then retrieveStats is 
    // called again userStats would be filled with same data twice and would return both, therefore needs to be reset below

    try {
        // Step 1: Identify most mistyped characters with error rate >= 10%
        const problematicChars: string[] = [];
        const rates = errorRates.value;
        const numberOfWords = store.numberOfWords
        console.log("Error rates:", errorRates.value)
        for (const char in rates) {
            if (rates[char] >= 0.1) {  // 10% or higher error rate
                problematicChars.push(char);
            }
        }

        // Step 2: Fetch all words from the database and compute their similarity score
        // Fetch only the '3_letters' column from the database
        const { data: words, error } = await supabase.from('words').select('3_letters');
        if (error) throw error;

        const scoredWords = words?.map(wordObj => {
            let score = 0;
            const word = wordObj['3_letters'];
            for (const char of word) {
                if (problematicChars.includes(char)) {
                    score++;
                }
            }
            return { word, score };
        }) || [];
        console.log("problematic chars:", problematicChars)

        // Sort words by score in descending order
        scoredWords.sort((a, b) => b.score - a.score);
        console.log("Scored Words:", scoredWords)

        // Create a weighted array
        const weightedWords: string[] = [];
        for (const { word, score } of scoredWords) {
            for (let i = 0; i <= score; i++) {
                weightedWords.push(word);
            }
        }
        console.log("Weighted Words:", weightedWords)

        // Step 3: Randomly select 50 words from the weighted array
        // Generate 50% (25 out of 50) of the training words based on problematic characters
        const selectedProblematicWords: string[] = [];
        for (let i = 0; i < (0.5 * numberOfWords); i++) {
            const randomIndex = Math.floor(Math.random() * weightedWords.length);
            selectedProblematicWords.push(weightedWords[randomIndex]);
        }
        console.log("Selected Problematic Words:", selectedProblematicWords);

        // Exclude "Space" from the slow words
        const filteredSlowWords = allTimeSlowWords.value.filter(entry => entry.word !== "Space");

        const selectedSlowWords: string[] = filteredSlowWords
            .map(entry => entry.word.toLowerCase())
            .filter(word => word.length >= 3)
            .slice(0, (0.25 * numberOfWords));
        console.log("Selected Slow Words:", selectedSlowWords);

        // Generate 25% (12 or 13 out of 50) of the training words based on top mistyped words
        const selectedTopMistypedWords: string[] = topMistypedWords.value
            .map(entry => entry.text.toLowerCase())
            .filter(word => word.length >= 3)
            .slice(0, (0.25 * numberOfWords));

        console.log("Selected Mistyped Words:", selectedTopMistypedWords);

        // Calculate the number of words coming from slowWords and topMistypedWords
        const slowAndMistypedCount = selectedSlowWords.length + selectedTopMistypedWords.length;

        // Calculate how many more words we need to fill the remaining slots to make it 50
        const additionalProblematicCount = numberOfWords - ((numberOfWords * 0.5) + slowAndMistypedCount);
        console.log("Additional problematic count:", additionalProblematicCount);

        // Generate additional words based on problematic characters
        const additionalProblematicWords: string[] = [];
        for (let i = 0; i < additionalProblematicCount; i++) {
            const randomIndex = Math.floor(Math.random() * weightedWords.length);
            additionalProblematicWords.push(weightedWords[randomIndex]);
        }
        console.log("Additional problematic words:", additionalProblematicWords);

        // Combine all the selected words
        const combinedWords = [...selectedProblematicWords, ...selectedSlowWords, ...selectedTopMistypedWords, ...additionalProblematicWords];

        // Shuffle the combinedWords array to mix the types of words
        for (let i = combinedWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combinedWords[i], combinedWords[j]] = [combinedWords[j], combinedWords[i]];
        }

        // Update the ref with the selected 50 training words
        trainingWords.value = combinedWords;

    } catch (e) {
        console.error('Error while generating training words:', e);
    }
    resetStats(); // empty user stats again to avoid handing total data to user statistics page (would load data twice) *NOTE* might be inefficient
    //*NOTE* can we separate last round data and data loaded from storage into different variables so we could keep the statistics loaded?
}

export function getTrainingWords() {
    return trainingWords.value;
}

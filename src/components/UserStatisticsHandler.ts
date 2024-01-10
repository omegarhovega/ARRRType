import { ref } from "vue";
import type { Ref, ComputedRef } from "vue";
import { useStore } from "../stores/store";
import { supabase } from "../supabase";
import {
    wpmPerSecond,
    grossWpmPerSecond,
    previousKeystrokes,
    previousCorrectKeystrokes,
    aggregatedData,
    identifySlowWords,
    updateAllTimeSlowWords,
    saveAllTimeSlowWords,
    aggregateHeatmapData,
    slowWords,
    setAverageWpmLast100,
    allTimeSlowWords,
} from './UserStatisticsCalculations';

export function useUserStatisticsHandler() {
    const store = useStore();

    // Reference for roundId
    const roundId = ref(0);

    // 1. Update Stats
    // *NOTE* excludes stats < 50% (might show results not saved for last round still, consider amending)
    function updateStats(newWpm: number, newGrossWpm: number, newAccuracy: number, errors: Array<{ attempted: string, expected: string, word: string }>, totalOccurrences: { [key: string]: number }, mistakesMade: { [key: string]: number }, consistency: number) {
        if (newAccuracy > 50) {
            try {
                roundId.value++;
                const newRound = {
                    id: roundId.value,
                    timestamp: new Date(),
                    wpm: newWpm,
                    grossWPM: newGrossWpm,
                    accuracy: newAccuracy,
                    errors: errors,
                    totalOccurrences: totalOccurrences,
                    mistakesMade: mistakesMade,
                    consistency: consistency
                };
                store.userStats.push(newRound);
            } catch (e) {
                console.error("Error while updating stats:", e);
            }
        } else {
            console.log("Statistics not updated due to accuracy being below 50%")
        }
    }

    // 2. Reset Stats
    function resetStats() {
        // reset data in Pinia store in preaparation of new round, after saving key variables to local store/database
        console.log("Calling resetStats")
        store.resetUserStats(); //(sets id, timestamp, wpm, grossWPM accuracy, errors, totalOccurrences, mistakesMade, consistency to null)
        store.resetKeystrokes();
        store.resetCorrectKeystrokes();
        store.resetWordsPerSecond(); // resets slowly typed words
        store.resetUniqueCorrectIndices();
        wpmPerSecond.value = []; // resets WPM per second values
        grossWpmPerSecond.value = [];
        previousKeystrokes.value = 0;
        previousCorrectKeystrokes.value = 0;
        console.log("resetting userStats:", store.userStats)
        console.log("resetting wpmPerSecond:", wpmPerSecond.value)
        console.log("resetting grossWpmPerSecond:", grossWpmPerSecond.value)
        console.log("resetting total Keystrokes:", store.totalKeystrokes)
        console.log("resetting correct Keystrokes:", store.correctKeystrokes)
        console.log("resetting previousKeystrokes:", previousKeystrokes.value)
        console.log("resetting previousCorrectKeystrokes:", previousCorrectKeystrokes.value)
        console.log("resetting wordsperSecond:", store.wordsPerSecond)
    }

    // 3. Save Stats
    async function saveStats(userSession?: any) {
        console.log("Calling saveStats")

        await setAverageWpmLast100(userSession);

        const avgWpm = store.averageWpmLast100;
        console.log("Calculated averageWpmLast100:", avgWpm);

        // If userSession is provided and has a user property, use the user ID, otherwise set userId to null
        const userId = userSession && userSession.user ? userSession.user.id : null;
        console.log("Received userId in saveStats:", userId);

        // Load last round/last 100 slow words for user
        identifySlowWords();
        console.log("Slow Words:", slowWords.value, allTimeSlowWords.value)
        await updateAllTimeSlowWords(userSession);
        await saveAllTimeSlowWords(userSession);

        const slowWordsCurrent = slowWords.value;
        const allTimeSlowWordsCurrent = allTimeSlowWords.value;

        // 1. LOGGED IN USERS (supabase data)
        if (userId) {
            // For registered users: Limit the stored statistics to the last 100 entries

            // 1. Limit statistics datapoints to 100 per player in Supabase
            // Fetch and delete oldest records if more than 100
            const { data, error: fetchError } = await supabase
                .from('user_stats')
                .select('id')
                .eq('user_id', userId)
                .order('id', { ascending: true });

            if (fetchError) {
                console.error("Error fetching stats for cleanup:", fetchError);
            } else if (data && data.length > 99) {
                // Determine the number of records to delete
                const recordsToDelete = data.length - 99;
                const idsToDelete = data.slice(0, recordsToDelete).map(record => record.id);

                // Delete the oldest records
                const { error: deleteError } = await supabase
                    .from('user_stats')
                    .delete()
                    .in('id', idsToDelete);

                if (deleteError) {
                    console.error("Error deleting old stats:", deleteError);
                }
            }
            // A: Statistics with data points for each round
            // Save general stats for each round to 'userStats' table
            const { error: insertError } = await supabase
                .from('user_stats')
                .insert(store.userStats.map(stat => ({
                    user_id: userId,
                    wpm: stat.wpm,
                    grossWPM: stat.grossWPM,
                    accuracy: stat.accuracy,
                    created_at: stat.timestamp,
                    errors: stat.errors,
                    totalOccurrences: stat.totalOccurrences,
                    mistakesMade: stat.mistakesMade,
                    consistency: stat.consistency
                })));

            if (insertError) {
                console.error("Error saving stats to Supabase:", insertError);
            } else {
                console.log("Stats saved successfully");
            }

            // B: Aggregated statistics one data point per user
            // Save last round's net/gross WPM per second to 'profiles' table
            // Allows to populate last round stats across sessions for registered users

            let gamesPlayed = 0;
            let totalTimePlayed = 0;
            let timeElapsed = 0;  // Initialize timeElapsed variable

            // Calculate timeElapsed for the current game
            if (store.endTime && store.startTime !== null) {
                timeElapsed = store.endTime.getTime() - store.startTime.getTime();
            }

            // Calculate bucket index for WPM and Accuracy
            const latestStats = store.userStats[store.userStats.length - 1];
            const wpmBucketIndex = calculateBucketIndex(latestStats.wpm, 'wpm');
            const accuracyBucketIndex = calculateBucketIndex(latestStats.accuracy, 'accuracy');

            // Fetch the current bucket arrays from the database
            const { data: profileData, error: profileFetchError } = await supabase
                .from('profiles')
                .select('wpm_buckets, accuracy_buckets, games_played, time_played')
                .eq('id', userId)
                .single();

            if (profileFetchError) {
                console.error("Error fetching profile for bucket update:", profileFetchError);
            } else {
                gamesPlayed = profileData.games_played || 0;
                totalTimePlayed = profileData.time_played || 0;
                // Increment the counters
                gamesPlayed++;
                totalTimePlayed += timeElapsed;
                // Increment the respective buckets
                profileData.wpm_buckets[wpmBucketIndex]++;
                profileData.accuracy_buckets[accuracyBucketIndex]++;

                // Save the updated buckets back to the database
                const { error: profileUpdateError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        last_round_wpm: JSON.stringify(wpmPerSecond.value),
                        last_round_gross_wpm: JSON.stringify(grossWpmPerSecond.value),
                        wpm_buckets: profileData.wpm_buckets,
                        accuracy_buckets: profileData.accuracy_buckets,
                        time_played: totalTimePlayed,
                        games_played: gamesPlayed,
                        '100_slow_words': allTimeSlowWordsCurrent,
                        'last_slow_words': slowWordsCurrent,
                    })
                    .eq('id', userId);

                if (profileUpdateError) {
                    console.error("Error saving last round WPM to Supabase:", profileUpdateError);
                } else {
                    console.log("Last round WPM saved successfully to profiles table");
                }
            }
        } else {
            // 2. GUEST USERS (local storage data)
            try {
                let combinedStats = [...store.userStats];
                // Fetch existing statistics for guest users from local storage
                const existingStats = localStorage.getItem("userStats");
                if (existingStats) {
                    const statsArray = JSON.parse(existingStats);
                    // 1. Limit statistics datapoints to 100 per player in local storage
                    const last100Stats = statsArray.length > 100 ? statsArray.slice(-100) : statsArray;
                    combinedStats = last100Stats.concat(combinedStats);
                }

                // Save all-time stats to local storage
                localStorage.setItem("userStats", JSON.stringify(combinedStats));
                localStorage.setItem("heatmapData", JSON.stringify(aggregatedData.value)); // is this necessary or can we just create it on the fly in the retrieveStats function?

                // Continue saving only the last value for wpmPerSecond
                localStorage.setItem("lastRoundWpm", JSON.stringify(wpmPerSecond.value));
                localStorage.setItem("lastRoundGrossWpm", JSON.stringify(grossWpmPerSecond.value));
                console.log("Stats saved successfully to local storage");
            } catch (e) {
                if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                    console.error("Local storage quota exceeded, unable to save stats");
                } else {
                    console.error("An unknown error occurred while saving to local storage:", e);
                }
            }
        }
    }

    // function to create buckets for histogram of all-time wpm and accuracy data for player
    function calculateBucketIndex(value: any, type: any) {
        if (type === 'wpm') {
            // For WPM, each bucket covers a range of 10
            // The last bucket (index 19) is for WPM >= 200
            return Math.min(Math.floor(value / 10), 19);
        } else if (type === 'accuracy') {
            // For accuracy, each bucket covers a range of 2.5%
            // Subtract 50 from the accuracy value, then divide by 2.5 to get the bucket index
            // The last bucket (index 19) is for accuracy >= 97.5%
            return Math.min(Math.floor((value - 50) / 2.5), 19);
        }
        return 0; // Default case
    }


    // 4. Retrieve Stats
    // populates store.userStats with historical statistics used for AllTimeStats and LastRoundStats and created heatmap and slow words data
    // key handler of data and should be called before using historical statistics data

    // 4. Retrieve Stats
    async function retrieveStats(userSession?: any) {
        console.log("Calling retrieveStats")
        const userId = userSession && userSession.user ? userSession.user.id : null;
        console.log("Received userId in retrieveStats:", userId);

        // 1. LOGGED IN USERS (supabase data)
        if (userId) {
            // Fetch the last roundId first
            const { data: roundData, error: roundError } = await supabase
                .from('user_stats')
                .select('id')
                .eq('user_id', userId)
                .order('id', { ascending: false });

            if (roundError) {
                console.error("Error fetching the last roundId:", roundError);
            } else if (roundData && roundData.length > 0) {
                roundId.value = roundData[0].id;
            }
            console.log("Round Id fetched", roundId.value);

            // Now fetch other statistics based on the last roundId
            const { data, error } = await supabase
                .from('user_stats')
                .select('id, wpm, grossWPM, accuracy, created_at, errors, totalOccurrences, mistakesMade, consistency')
                .eq('user_id', userId)
                .order('id', { ascending: true }); // to show last round played last

            if (error) {
                console.error("Error retrieving stats from Supabase:", error);
            } else {
                console.log("Fetched data from Supabase:", data);
                store.userStats = data.map(stat => ({
                    id: stat.id,
                    timestamp: new Date(stat.created_at),
                    wpm: stat.wpm,
                    grossWPM: stat.grossWPM,
                    accuracy: stat.accuracy,
                    errors: stat.errors,
                    totalOccurrences: stat.totalOccurrences || {},
                    mistakesMade: stat.mistakesMade || {},
                    consistency: stat.consistency
                }));
                aggregateHeatmapData();
            }


            // Fetch total time played and number of games from Supabase
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('last_round_wpm, last_round_gross_wpm, time_played, games_played') // Fetch these two new fields
                .eq('id', userId)
                .single();


            if (profileError) {
                console.error("Error retrieving last_round_wpm from Supabase:", profileError);
            } else {
                if (profileData && profileData.last_round_wpm) {
                    wpmPerSecond.value = JSON.parse(profileData.last_round_wpm);
                }
                if (profileData && profileData.last_round_gross_wpm) {
                    grossWpmPerSecond.value = JSON.parse(profileData.last_round_gross_wpm);
                }
                // Update the store with total time played and number of games
                if (profileData) {
                    if (profileData.time_played !== null) {
                        store.totalTimePlayed = profileData.time_played;
                    }
                    if (profileData.games_played !== null) {
                        store.numberOfGamesPlayed = profileData.games_played;
                    }
                }
            }

        } else {
            // 2. GUEST USERS (local storage data)
            try {
                // Retrieve from local storage
                const stats = localStorage.getItem("userStats");
                const heatmapData = localStorage.getItem("heatmapData");
                const lastRoundWpm = localStorage.getItem("lastRoundWpm");
                const lastRoundGrossWpm = localStorage.getItem("lastRoundGrossWpm");

                if (stats) {
                    store.userStats = JSON.parse(stats);
                    console.log("Saved stats:", store.userStats);
                }
                if (heatmapData) {
                    aggregatedData.value = JSON.parse(heatmapData);
                    aggregateHeatmapData();
                }
                if (lastRoundWpm) {
                    wpmPerSecond.value = JSON.parse(lastRoundWpm);
                }
                if (lastRoundGrossWpm) {
                    grossWpmPerSecond.value = JSON.parse(lastRoundGrossWpm);
                }
                console.log("Successfully retrieved stats from local storage");

                // Update the store with total time played and number of games
                const storedTotalTimePlayed = localStorage.getItem("totalTimePlayed");
                const storedGamesPlayed = localStorage.getItem("gamesPlayed");
                console.log("fetching games played from local storage:", storedGamesPlayed)
                if (storedTotalTimePlayed !== null) {
                    store.totalTimePlayed = parseInt(storedTotalTimePlayed, 10);
                }
                if (storedGamesPlayed !== null) {
                    store.numberOfGamesPlayed = parseInt(storedGamesPlayed, 10);
                }
            } catch (e) {
                // Handle specific errors here
                if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                    console.error("Local storage quota exceeded, unable to retrieve stats");
                } else {
                    console.error("An unknown error occurred while retrieving from local storage:", e);
                }
            }
        }
    }


    // Reusable wrapper function for convenience, combines calc. consistency, update and save statistics after round
    // *NOTE* manual threshold set here: Results in a round where accuarcy is 50% or below will not be saved
    function saveGameStatistics(
        wpm: ComputedRef<number>,
        grossWpm: ComputedRef<number>,
        accuracy: Ref<number> | ComputedRef<number>,
        errors: Ref<Array<{ attempted: string; expected: string; word: string }>>,
        totalOccurrences: Ref<{ [key: string]: number; }>,
        mistakesMade: Ref<{ [key: string]: number; }>,
        consistencyForStat: ComputedRef<number>,
        updateStats: Function,
        saveStats: Function,
    ) {
        console.log("Calling saveGameStatistics")
        console.log("saveGameStatistics", store.endTime, store.startTime, accuracy.value)
        if (store.endTime && store.startTime !== null && accuracy.value > 50) {

            // Update stats
            updateStats(
                wpm.value,
                grossWpm.value,
                accuracy.value,
                errors.value,
                totalOccurrences.value,
                mistakesMade.value,
                consistencyForStat
            );

            // Save stats
            if (store.userSession && accuracy.value > 50) {
                saveStats(store.userSession);
            } else if (accuracy.value > 50) {
                saveStats(); // For guest users, save to local storage
            } else {
                console.log("Encountered exception saving results.")
            }
        } else {
            console.log("Results not saved.")
        }
    }


    return {
        updateStats,
        resetStats,
        saveStats,
        retrieveStats,
        saveGameStatistics,
        setAverageWpmLast100
    };
}

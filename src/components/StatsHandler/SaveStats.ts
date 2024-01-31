import { useStore } from "../../stores/store";
import type { UserStat } from "../../stores/store";
import { supabase } from "../../supabase";
import { setAverageWpmLast100 } from './../Stats/WPMAccAverage'
import { aggregatedData } from './../Stats/MistypedCharacters'
import { identifySlowWords, updateAllTimeSlowWords, saveAllTimeSlowWords, slowWords, allTimeSlowWords } from './../Stats/SlowWords'

// Define a type for profileData for better type checking
type ProfileData = {
    id: string,
    wpm_buckets: number[];
    accuracy_buckets: number[];
    last_round_wpm: number[];
    last_round_gross_wpm: number[];
    games_played: number;
    time_played: number;
};

// Define a default profile data structure
const defaultProfileData: ProfileData = {
    id: "",
    wpm_buckets: [],
    accuracy_buckets: [],
    last_round_wpm: [],
    last_round_gross_wpm: [],
    games_played: 0,
    time_played: 0
};


// Save Stats per User (all-time, last 100)
// ----------------------------------------
export async function saveStats(userSession?: any) {
    const store = useStore();

    await setAverageWpmLast100(userSession);

    // If userSession is provided and has a user property, use the user ID, otherwise set userId to null
    const userId = userSession && userSession.user ? userSession.user.id : null;

    // Load last round/last 100 slow words for user
    identifySlowWords();
    await updateAllTimeSlowWords(userSession);
    await saveAllTimeSlowWords(userSession);

    const slowWordsCurrent = slowWords.value;
    const allTimeSlowWordsCurrent = allTimeSlowWords.value;

    // Fetch the current profile data from the database
    let profileData;

    // 1. LOGGED IN USERS (supabase data)
    if (userId) {
        profileData = await fetchUserData(userId);
        // For registered users: Limit the stored statistics to the last 100 entries

        try {
            profileData = await fetchUserData(userId);
            await cleanupUserStats(userId);
            await saveUserStats(userId, store.userStats);
        } catch (error) {
            console.error("An error occurred during user data handling:", error);
        }

        // B: Aggregated statistics one data point per user
        // Save last round's net/gross WPM per second to supabase 'profiles' table
        // Allows to populate last round stats across sessions for registered users

        let timeElapsed = 0;

        // Calculate timeElapsed for the current game
        if (store.endTime && store.startTime !== null) {
            timeElapsed = store.endTime.getTime() - store.startTime.getTime();
        }

        const latestStats = store.userStats[store.userStats.length - 1];
        const lastWpmPerSecond = latestStats ? latestStats.wpmPerSecond : [];
        const lastGrossWpmPerSecond = latestStats ? latestStats.grossWpmPerSecond : [];
        const wpmBucketIndex = calculateBucketIndex(latestStats.wpm, 'wpm');
        const accuracyBucketIndex = calculateBucketIndex(latestStats.accuracy, 'accuracy');

        // Assuming profileData already contains the initial wpm_buckets and accuracy_buckets
        let gamesPlayed = profileData ? profileData.games_played || 0 : 0;
        let totalTimePlayed = profileData ? profileData.time_played || 0 : 0;

        gamesPlayed++;
        totalTimePlayed += timeElapsed;

        // Update the respective buckets
        profileData.wpm_buckets[wpmBucketIndex]++;
        profileData.accuracy_buckets[accuracyBucketIndex]++;

        const profileUpdates = {
            id: userId,
            last_round_wpm: lastWpmPerSecond,
            last_round_gross_wpm: lastGrossWpmPerSecond,
            wpm_buckets: profileData.wpm_buckets,
            accuracy_buckets: profileData.accuracy_buckets,
            time_played: totalTimePlayed,
            games_played: gamesPlayed,
            '100_slow_words': allTimeSlowWordsCurrent, // Adjust as per your actual data structure
            'last_slow_words': slowWordsCurrent, // Adjust as per your actual data structure
        };

        try {
            await updateUserProfile(userId, profileUpdates);
        } catch (error) {
            console.error("An error occurred during profile update:", error);
        }

    } else {
        // 2. GUEST USERS (local storage data)
        await handleGuestUser(store.userStats);
    }
}

// Helper functions for saveStats
// --------------------------------

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

async function fetchUserData(userId: string): Promise<ProfileData> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, wpm_buckets, accuracy_buckets, last_round_wpm, last_round_gross_wpm, games_played, time_played')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.error("Error fetching profile data or no data found:", error);
            return defaultProfileData;
        }

        return data;
    } catch (error) {
        console.error("An error occurred during fetching user data:", error);
        return defaultProfileData;
    }
}


// limited to 99 entries for individual game stats per user (does not apply for total aggregated stats)
async function cleanupUserStats(userId: any) {
    const { data, error } = await supabase
        .from('user_stats')
        .select('id')
        .eq('user_id', userId)
        .order('id', { ascending: true });

    if (error) {
        console.error("Error fetching stats for cleanup:", error);
        throw error;
    }

    if (data && data.length > 99) {
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
}

// save user stats per round played
async function saveUserStats(userId: string, userStats: UserStat[]) {
    const { error } = await supabase
        .from('user_stats')
        .insert(userStats.map(stat => ({
            user_id: userId,
            wpm: stat.wpm,
            grossWPM: stat.grossWPM,
            accuracy: stat.accuracy,
            wpmPerSecond: stat.wpmPerSecond,
            grossWpmPerSecond: stat.grossWpmPerSecond,
            created_at: stat.timestamp,
            errors: stat.errors,
            totalOccurrences: stat.totalOccurrences,
            mistakesMade: stat.mistakesMade,
            consistency: stat.consistency
        })));

    if (error) {
        console.error("Error saving stats to Supabase:", error);
        throw error;
    }
}

async function updateUserProfile(userId: any, profileUpdates: {
    id: string,
    last_round_wpm: number[];
    last_round_gross_wpm: number[];
    wpm_buckets: number[];
    accuracy_buckets: number[];
    time_played: number;
    games_played: number;
    '100_slow_words': { word: string; wpm: number; }[]; // Adjust the type according to your actual data
    'last_slow_words': { word: string; wpm: number; }[]; // Adjust the type according to your actual data
}) {
    const { error } = await supabase
        .from('profiles')
        .upsert(profileUpdates)
        .eq('id', userId)

    if (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
}


async function handleGuestUser(userStats: UserStat[]) {
    try {
        let combinedStats = [...userStats];

        // Fetch existing statistics for guest users from local storage
        const existingStats = localStorage.getItem("userStats");
        if (existingStats) {
            const statsArray: UserStat[] = JSON.parse(existingStats);
            // Limit statistics datapoints to 100 per player in local storage
            const last100Stats = statsArray.length > 100 ? statsArray.slice(-100) : statsArray;
            combinedStats = last100Stats.concat(combinedStats);
        }

        // Save all-time stats to local storage
        localStorage.setItem("userStats", JSON.stringify(combinedStats));

        // Additional data like heatmapData, lastRoundWpm, etc., can also be updated here
        // Example for lastRoundWpm:
        if (userStats.length > 0) {
            const latestStat = userStats[userStats.length - 1];
            localStorage.setItem("lastRoundWpm", JSON.stringify(latestStat.wpmPerSecond));
            localStorage.setItem("lastRoundGrossWpm", JSON.stringify(latestStat.grossWpmPerSecond));
            localStorage.setItem("heatmapData", JSON.stringify(aggregatedData.value));
        }

        console.log("Stats saved successfully to local storage for guest user");
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            console.error("Local storage quota exceeded, unable to save stats");
        } else {
            console.error("An unknown error occurred while saving to local storage:", e);
        }
    }
}

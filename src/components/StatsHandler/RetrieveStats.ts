import { ref } from "vue";
import { useStore } from "../../stores/store";
import { supabase } from "../../supabase";
import { wpmPerSecond, grossWpmPerSecond } from './../Stats/WPMAccPerSecond'
import { aggregatedData, aggregateHeatmapData } from './../Stats/MistypedCharacters'

// Retrieve Stats
// populates store.userStats with historical statistics used for AllTimeStats and LastRoundStats and created heatmap and slow words data
// key handler of data and should be called before using historical statistics data

export async function retrieveStats(userSession?: any) {
    const userId = userSession && userSession.user ? userSession.user.id : null;
    const store = useStore();
    // Reference for roundId
    const roundId = ref(0);

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

        // Now fetch other statistics based on the last roundId
        const { data, error } = await supabase
            .from('user_stats')
            .select('id, wpm, grossWPM, accuracy, wpmPerSecond, grossWpmPerSecond, created_at, errors, totalOccurrences, mistakesMade, consistency')
            .eq('user_id', userId)
            .order('id', { ascending: true }); // to show last round played last

        if (error) {
            console.error("Error retrieving stats from Supabase:", error);
        } else {
            store.userStats = data.map(stat => ({
                id: stat.id,
                timestamp: new Date(stat.created_at),
                wpm: stat.wpm,
                grossWPM: stat.grossWPM,
                accuracy: stat.accuracy,
                wpmPerSecond: stat.wpmPerSecond,
                grossWpmPerSecond: stat.grossWpmPerSecond,
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
            // wpm per second data currently stored in jsonb format in supabase table (Supabase automatically parses JSON columns into JavaScript objects), consider converting to int4[]
            if (profileData && profileData.last_round_wpm) {
                wpmPerSecond.value = profileData.last_round_wpm;
            }
            if (profileData && profileData.last_round_gross_wpm) {
                grossWpmPerSecond.value = profileData.last_round_gross_wpm;
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

            // Update the store with total time played and number of games
            const storedTotalTimePlayed = localStorage.getItem("totalTimePlayed");
            const storedGamesPlayed = localStorage.getItem("gamesPlayed");
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
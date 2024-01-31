import { computed } from "vue";
import { supabase } from "../../supabase";
import { useStore } from "../../stores/store";

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



import {
    wpm,
    grossWpm,
    wpmPerSecond,
    grossWpmPerSecond,
    aggregatedData,
    startWpmTracking,
    stopWpmTracking,
    consistencyForStat,
    calculateConsistency,
    calculateGrossWPM,
    calculateWPM,
    identifySlowWords,
    updateAllTimeSlowWords,
    saveAllTimeSlowWords,
    loadAllTimeSlowWords,
    aggregateHeatmapData,
    errorRates,
    topMistypedWords,
    lastRoundErrorRates,
    lastRoundMistypedWords,
    accuracyPerSecond,
    slowWords,
    allTimeSlowWords,
} from './UserStatisticsCalculations';

import {
    useUserStatisticsHandler,
} from './UserStatisticsHandler';

export function useUserStatistics() {
    const {
        updateStats,
        resetStats,
        saveStats,
        retrieveStats,
        saveGameStatistics,
    } = useUserStatisticsHandler();

    // Additional logic can go here

    return {
        // Variables
        wpm,
        grossWpm,
        wpmPerSecond,
        consistencyForStat,
        grossWpmPerSecond,
        aggregatedData,
        errorRates,
        topMistypedWords,
        lastRoundErrorRates,
        lastRoundMistypedWords,
        accuracyPerSecond,
        slowWords,
        allTimeSlowWords,

        // Methods
        resetStats,
        retrieveStats,
        updateStats,
        saveStats,
        startWpmTracking,
        stopWpmTracking,
        calculateConsistency,
        calculateGrossWPM,
        calculateWPM,
        identifySlowWords,
        updateAllTimeSlowWords,
        saveAllTimeSlowWords,
        loadAllTimeSlowWords,
        aggregateHeatmapData,
        saveGameStatistics,

        // Any additional variables and methods
    };
}

// You can also export individual items if needed
export {
    wpmPerSecond,
    grossWpmPerSecond,
    aggregatedData,
    aggregateHeatmapData,
};

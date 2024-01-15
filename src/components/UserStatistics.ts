// helper file for user statistics

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

    return {
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
    };
}

export {
    wpmPerSecond,
    grossWpmPerSecond,
    aggregatedData,
    aggregateHeatmapData,
};

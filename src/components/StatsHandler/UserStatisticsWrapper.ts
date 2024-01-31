// Wrapper for user statistics
//--------------------------------

// import of various statistics calculations
import { consistencyForStat, calculateConsistency } from '../Stats/Consistency'

import { wpm, grossWpm, calculateWPM, calculateGrossWPM, setAverageWpmLast100 } from '../Stats/WPMAccAverage'

import { wpmPerSecond, grossWpmPerSecond, startWpmTracking, stopWpmTracking, accuracyPerSecond, previousKeystrokes, previousCorrectKeystrokes } from '../Stats/WPMAccPerSecond'

import { aggregatedData, errorRates, getTopMistypedCharacters, lastRoundErrorRates, aggregateHeatmapData } from '../Stats/MistypedCharacters'

import { lastRoundMistypedWords, topMistypedWords, historicalWordErrors } from '../Stats/MistypedWords'

import { identifySlowWords, updateAllTimeSlowWords, saveAllTimeSlowWords, loadAllTimeSlowWords, slowWords, uniqueSlowWords, allTimeSlowWords } from '../Stats/SlowWords'


// import of handler functions for saving, updating and loading statistics
import {
    retrieveStats,
} from './RetrieveStats';

import {
    saveStats,
} from './SaveStats';

import {
    updateStats,
    resetStats,
} from './UpdateResetStats';

import {
    saveGameStatistics,
} from './StatsHandler';


// wrapper function for use in game components
export function useUserStatistics() {

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

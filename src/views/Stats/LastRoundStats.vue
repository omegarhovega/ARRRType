<!-- Component Last Round Stats) -->

<template>
  <div>
    <div class="mt-1 mb-2">WPM and Accuracy per Second (Last Round):</div>
    <div class="stats-wrapper">
      <div class="wpm-accuracy-container">
        <div class="wpm-container">
          <div class="label">Avg. WPM(#)</div>
          <div class="wpm">
            {{ lastRound ? lastRound.wpm : 'N/A' }}
          </div>
        </div>
        <div class="accuracy-container">
          <div class="label">Avg. Acc.(%)</div>
          <div class="accuracy">
            {{ lastRound ? lastRound.accuracy : 'N/A' }}
          </div>
        </div>
      </div>
      <LastRoundLineChart
        class="chart-container"
        :key="chartKey"
        :averageWpmForLastRound="lastRound ? lastRound.wpm : 0"
        :wpmPerSecondData="slicedWpmPerSecond"
        :grossWpmPerSecondData="slicedGrossWpmPerSecond"
        :accuracyPerSecondData="slicedAccuracyPerSecond"
      />
    </div>

    <div class="mt-5 mb-2">Accuracy per Key (Last Round):</div>
    <KeyboardHeatmap :errorRates="lastRoundErrorRates" />

    <div class="mt-5 mb-2">Mistyped Words (Last Round):</div>
    <MistypedWordsTable :lastRoundMistypedWords="lastRoundMistypedWords" />

    <div class="mt-5 mb-2">Consistency (Last Round):</div>
    <p>Your relative Consistency is {{ lastRoundConsistency }} ({{ lastRoundConsistencyComment }})</p>
    <div class="mt-8 text-sm">Note: Statistics shown exclude rounds with accuracy of 50% or lower and do not include measurements from single word, keys or custom training. WPM statistic assumes average word length of 5 characters.</div>
  </div>
</template>
    
  <script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  computed,
  ref,
  watchEffect,
} from "vue";
import { useUserStatistics } from "../../components/UserStatistics";
import LastRoundLineChart from "./LineChartComponentLast.vue";
import MistypedWordsTable from "./MistypedWordsTableLast.vue";
import KeyboardHeatmap from "./KeyboardHeatmap.vue";
import { useStore } from "../../stores/store";

interface RoundStat {
  id: number;
  timestamp: Date;
  wpm: number;
  grossWPM: number;
  accuracy: number;
  errors: Array<{ attempted: string; expected: string; word: string }>;
  totalOccurrences: { [key: string]: number };
  mistakesMade: { [key: string]: number };
  consistency: number;
}

export default defineComponent({
  name: "LastRoundStats",
  components: {
    LastRoundLineChart,
    MistypedWordsTable,
    KeyboardHeatmap,
  },
  setup() {
    const store = useStore();
    const userSession = computed(() => store.userSession);
    const {
      retrieveStats,
      resetStats,
      wpmPerSecond,
      grossWpmPerSecond,
      accuracyPerSecond,
      lastRoundMistypedWords,
      lastRoundErrorRates,
    } = useUserStatistics();

    const chartKey = ref(0); // Key to re-render the chart

    // Define lastRound as last entry of userStats
    const lastRound = computed<RoundStat | null>(() => {
      return store.userStats.length
        ? store.userStats[store.userStats.length - 1]
        : null;
    });

    // consistency based on last round data
    const lastRoundConsistency = computed(() => {
      return lastRound.value
        ? lastRound.value.consistency.toFixed(2) + "%"
        : "N/A";
    });

    const lastRoundConsistencyComment = computed(() => {
      const consistency = lastRound.value ? lastRound.value.consistency : 0;

      let comment = "Poor consistency";
      if (consistency === 0) comment = "Not enough data";
      else if (consistency <= 30) comment = "Excellent";
      else if (consistency <= 50) comment = "Good";
      else if (consistency <= 70) comment = "Average";
      else if (consistency >= 70) comment = "Below average";

      return comment;
    });

    //Option to slice e.g. first value of WPM per second to prune outliers (currently not in use)
    const slicedWpmPerSecond = computed(() => {
      return wpmPerSecond.value.slice(0);
    });

    const slicedGrossWpmPerSecond = computed(() => {
      return grossWpmPerSecond.value.slice(0);
    });

    const slicedAccuracyPerSecond = computed(() => {
      return accuracyPerSecond.value.slice(0);
    });

    onMounted(async () => {
      if (userSession.value) {
        await retrieveStats(userSession.value);
      } else {
        await retrieveStats();
      }
    });

    onUnmounted(() => {
      resetStats(); // clears previous round data
    });

    // Watch for changes in wpmPerSecond and increments chartKey
    watchEffect(() => {
      chartKey.value++;
      wpmPerSecond.value;
      grossWpmPerSecond.value;
    });

    return {
      lastRound,
      slicedWpmPerSecond,
      slicedGrossWpmPerSecond,
      slicedAccuracyPerSecond,
      lastRoundMistypedWords,
      lastRoundConsistency,
      lastRoundConsistencyComment,
      lastRoundErrorRates,
      chartKey,
    };
  },
});
</script>
  
<style scoped>
.stats-wrapper {
  display: flex;
  align-items: center;
}

.wpm-accuracy-container {
  width: 150px;
  flex-shrink: 0; /* Prevent shrinking */
  text-align: center;
}

.wpm-container,
.accuracy-container {
  text-align: center;
}

.label {
  font-size: 12px;
}

.wpm {
  font-size: 50px;
  color: #e69500;
}

.accuracy {
  font-size: 50px;
  color: #677b91;
}

.chart-container {
  width: 100%;
}

LastRoundLineChart {
  flex-grow: 1;
}
</style>

  
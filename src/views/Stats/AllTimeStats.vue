<!-- Component (Last 100 Stats) -->

<template>
  <div class="all-time-stats">
    <div class="mt-1 mb-2">WPM and Accuracy:</div>
    <UserStatsLineChart
      :key="chartKey"
      :wpmData="wpmData"
      :grossWpmData="grossWpmData"
      :accuracyData="accuracyData"
    />
    <div class="mt-5 mb-2">Accuracy per Key:</div>
    <KeyboardHeatmap :errorRates="errorRates" />
    <div class="mt-5 mb-2">Most mistyped words:</div>
    <MistypedWordsTable :topMistypedWords="topMistypedWords" />
    <div class="mt-5 mb-2">Consistency:</div>
    <p>Your relative Consistency is {{ consistencyForStat.percentage }} ({{ consistencyForStat.comment }})</p>
    <div class="mt-8 text-sm">Note: Statistics shown exclude rounds with accuracy of 50% or lower and do not include measurements from single word, keys or custom training. WPM statistic assumes average word length of 5 characters.</div>
  </div>
</template>
  
<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  computed,
  watchEffect,
  onUnmounted,
} from "vue";
import UserStatsLineChart from "./LineChartComponent.vue";
import KeyboardHeatmap from "./KeyboardHeatmap.vue";
import MistypedWordsTable from "./MistypedWordsTable.vue";
import { useUserStatistics } from "../../components/StatsHandler/UserStatisticsWrapper";
import { useStore } from "../../stores/store";

export default defineComponent({
  name: "UserStatsMain",
  components: {
    UserStatsLineChart,
    KeyboardHeatmap,
    MistypedWordsTable,
  },
  setup() {
    const store = useStore();
    const userSession = computed(() => store.userSession);
    const { retrieveStats, resetStats, errorRates, topMistypedWords } =
      useUserStatistics();
    const chartKey = ref(0);

    onMounted(async () => {
      // retrieves all historical stats from database/local storage for use and fills userStats variable
      if (userSession.value) {
        await retrieveStats(userSession.value);
      } else {
        await retrieveStats();
      }
    });

    onUnmounted(() => {
      resetStats(); // clears data
    });

    // Process userStats to get WPM and Accuracy arrays
    const wpmData = ref(store.userStats.map((stat) => stat.wpm));
    const grossWpmData = ref(store.userStats.map((stat) => stat.grossWPM));
    const accuracyData = ref(store.userStats.map((stat) => stat.accuracy));

    watchEffect(() => {
      chartKey.value++;
      // Log the current value of chartKey
      wpmData.value = store.userStats.map((stat) => stat.wpm);
      grossWpmData.value = store.userStats.map((stat) => stat.grossWPM);
      accuracyData.value = store.userStats.map((stat) => stat.accuracy);
    });

    //calculate consistency over available values
    const consistencyData = computed(() =>
      store.userStats.map((stat) => stat.consistency)
    );

    const consistencyForStat = computed(() => {
      if (consistencyData.value.length === 0)
        return { percentage: "N/A", comment: "Not enough data" };

      const total = consistencyData.value.reduce((acc, val) => acc + val, 0);

      const averageConsistency = total / consistencyData.value.length;

      const formattedPercentage = averageConsistency.toFixed(2) + "%";

      let comment = "Poor consistency";
      if (averageConsistency <= 30) comment = "Excellent";
      else if (averageConsistency <= 50) comment = "Good";
      else if (averageConsistency <= 70) comment = "Average";
      else if (averageConsistency >= 70) comment = "Below average";

      return {
        percentage: formattedPercentage,
        comment: comment,
      };
    });

    return {
      wpmData,
      grossWpmData,
      accuracyData,
      chartKey,
      errorRates,
      topMistypedWords,
      consistencyForStat,
      userSession,
    };
  },
});
</script>
  
<style scoped>
.all-time-stats {
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}
</style>
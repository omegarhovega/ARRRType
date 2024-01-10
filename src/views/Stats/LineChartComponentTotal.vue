<template>
  <div>
    <div class="mt-0">Total Games Played by All Users (by You): {{ totalGamesPlayed }} ({{ totalGamesPlayedByUser }})</div>
    <div class="mt-1">Total Time Played by All Users (by You): {{ formattedTotalTimePlayed }} ({{ formattedUserTotalTimePlayed }})</div>
    <div class="mt-5">WPM Distribution:</div>
    <BarChart
      :chartData="wpmHistogramData"
      :options="histogramOptions"
      style="height: 250px;"
    />
    <div class="mt-5">Accuracy Distribution:</div>
    <BarChart
      :chartData="accuracyHistogramData"
      :options="accuracyHistogramOptions"
      style="height: 250px;"
    />
  </div>
</template>


<script lang="ts">
import { defineComponent, computed, ref, onMounted } from "vue";
import { BarChart } from "vue-chart-3";
import { Chart, registerables } from "chart.js";
import { supabase } from "../../supabase";

Chart.register(...registerables);

export default defineComponent({
  name: "UserStatsBarChartTotal",
  components: {
    BarChart,
  },
  props: {
    wpmHistogram: {
      type: Array,
      default: () => [],
    },
    grossWpmHistogram: {
      type: Array,
      default: () => [],
    },
    accuracyHistogram: {
      type: Array,
      default: () => [],
    },
    individualWpmHistogram: {
      type: Array,
      default: () => [],
    },
    individualAccuracyHistogram: {
      type: Array,
      default: () => [],
    },
    totalGamesPlayedByUser: {
      type: Number,
      default: 0,
    },
    totalTimePlayedByUser: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    // WPM Histogram labels (0-10, 10-20, ..., 190-200, 200+)
    const wpmHistogramLabels = Array.from({ length: 21 }, (_, i) =>
      i === 20 ? "200+" : `${10 * i} - ${10 * (i + 1)}`
    );

    // Accuracy Histogram labels (50-52.5%, 52.5-55%, ..., 97.5-100%)
    const accuracyHistogramLabels = Array.from(
      { length: 20 },
      (_, i) => `${50 + 2.5 * i}% - ${52.5 + 2.5 * i}%`
    );

    const createHistogramChartData = (
      allPlayersHistogramData: any[],
      individualPlayerHistogramData: any[],
      labels: string[]
    ) => ({
      labels,
      datasets: [
        {
          label: "All Users (All time)",
          data: allPlayersHistogramData,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "Your Stats (All time)",
          data: individualPlayerHistogramData,
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    });

    const histogramOptions = ref({
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "WPM Range",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Frequency",
          },
        },
      },
    });

    const accuracyHistogramOptions = ref({
      ...histogramOptions.value,
      scales: {
        ...histogramOptions.value.scales,
        x: {
          title: {
            display: true,
            text: "Accuracy Range",
          },
        },
      },
    });

    const wpmHistogramData = computed(() =>
      createHistogramChartData(
        props.wpmHistogram ?? [],
        props.individualWpmHistogram ?? [],
        wpmHistogramLabels
      )
    );

    const accuracyHistogramData = computed(() =>
      createHistogramChartData(
        props.accuracyHistogram ?? [],
        props.individualAccuracyHistogram ?? [],
        accuracyHistogramLabels
      )
    );

    const totalGamesPlayed = ref(0);

    // Function to fetch total games count
    async function fetchTotalGames() {
      let { data, error } = await supabase
        .from("total_games")
        .select("total_count")
        .single();

      if (data && !error) {
        totalGamesPlayed.value = data.total_count;
      } else {
        console.error("Error fetching total games:", error);
      }
    }

    const totalTimePlayed = ref(0); // will hold the total time played in milliseconds

    async function fetchTotalTimePlayed() {
      let { data, error } = await supabase
        .from("total_games")
        .select("total_time")
        .single();

      if (data && !error) {
        totalTimePlayed.value = data.total_time; // Assuming total_time is in milliseconds
      } else {
        console.error("Error fetching total time played:", error);
      }
    }

    const formattedTotalTimePlayed = computed(() => {
      const totalSeconds = Math.floor(totalTimePlayed.value / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });

    const formattedUserTotalTimePlayed = computed(() => {
      const totalSeconds = Math.floor(props.totalTimePlayedByUser / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });

    onMounted(() => {
      fetchTotalGames();
      fetchTotalTimePlayed();
    });

    return {
      wpmHistogramData,
      accuracyHistogramData,
      histogramOptions,
      accuracyHistogramOptions,
      totalGamesPlayed,
      formattedTotalTimePlayed,
      formattedUserTotalTimePlayed,
    };
  },
});
</script>


<style scoped>
/* styles */
</style>

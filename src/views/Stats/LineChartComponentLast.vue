<!-- WPM and accuracy charts for Last Round Stats -->
<template>
  <div>
    <LineChart
      :chartData="chartData"
      :options="chartOptions"
      style="height: 250px;"
    />
    <LineChart
      :chartData="accuracyChartData"
      :options="accuracyChartOptions"
      style="height: 120px;"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { LineChart } from "vue-chart-3";
import { Chart, registerables } from "chart.js";
import type { TooltipItem, LegendItem, ChartConfiguration } from "chart.js";
Chart.register(...registerables);

export default defineComponent({
  name: "LastRoundLineChart",
  components: {
    LineChart,
  },
  props: {
    averageWpmForLastRound: {
      type: Number,
      required: true,
    },
    wpmPerSecondData: {
      type: Array as () => (number | null)[],
      required: true,
    },
    grossWpmPerSecondData: {
      type: Array as () => (number | null)[],
      required: true,
    },
    accuracyPerSecondData: {
      type: Array as () => (number | null)[],
      required: true,
    },
  },
  setup(props) {
    const labels = Array.from(
      { length: props.wpmPerSecondData.length },
      (_, i) => `${i + 1}`
    );

    // Calculate the average WPM for the last round
    const wpmData = props.wpmPerSecondData || [];
    const averageWpm = wpmData.length
      ? wpmData.reduce(
          (acc: number, val: number | null) => acc + (val ?? 0),
          0
        ) / wpmData.length
      : 0;
    // Create an array filled with the average WPM
    const averageWpmData = Array.from(
      { length: wpmData.length },
      () => averageWpm
    );

    const chartData = ref({
      labels,
      datasets: [
        {
          label: "WPM",
          data: props.wpmPerSecondData,
          borderColor: "#e69500",
          fill: true,
          backgroundColor: "rgba(230, 149, 0, 0.1)",
          pointStyle: "rectRounded",
          tension: 0.3,
        },
        {
          label: "Gross WPM",
          data: props.grossWpmPerSecondData,
          borderColor: "#38516b",
          fill: true,
          backgroundColor: "rgba(56, 81, 107, 0.5)",
          pointStyle: "rectRounded",
          tension: 0.3,
        },
        {
          label: "Average WPM",
          data: Array(props.wpmPerSecondData.length).fill(
            props.averageWpmForLastRound
          ), // Filling the array with the average value
          borderColor: "#e69500", // Red, for example
          fill: false, // No fill beneath the line
          pointRadius: 0, // No points on the line
          borderWidth: 1, // Thinner line
          borderDash: [0, 5], // Dots pattern
          borderCapStyle: "round", // Round dots
          tension: 0, // Straight line
        },
      ],
    } as any);

    const chartOptions = ref({
      responsive: true,
      scales: {
        x: {
          display: false,
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "WPM (#)",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            filter: function (item: LegendItem, chart: ChartConfiguration) {
              return item.text !== "Average WPM";
            },
          },
        },
      },
    });

    const accuracyChartData = ref({
      labels,
      datasets: [
        {
          type: "bar",
          label: "none",
          data: props.accuracyPerSecondData as number[], // Use accuracyData prop
          borderColor: "#677b91",
          backgroundColor: "rgba(103, 123, 145, 0.4)",
          barThickness: 10,
        },
      ],
    } as any);

    const accuracyChartOptions = ref({
      responsive: true,
      scales: {
        x: {
          type: "category",
          beginAtZero: true,
          title: {
            display: true,
            text: "Seconds",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Acc. (%)",
          },
        },
      },
      plugins: {
        legend: {
          display: false, // Hide labels
        },
        tooltip: {
          callbacks: {
            label: function (context: TooltipItem<"bar">) {
              return `Accuracy: ${context.raw}`; // Customize tooltip label
            },
          },
        },
      },
    });

    return {
      chartData,
      chartOptions,
      accuracyChartData,
      accuracyChartOptions,
    };
  },
});
</script>

<style scoped>
LineChart + LineChart {
  margin-top: 20px;
}
</style>


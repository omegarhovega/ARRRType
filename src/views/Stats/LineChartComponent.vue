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
import { LineChart } from "vue-chart-3"; // Import LineChart
import { Chart, registerables } from "chart.js";
import type { TooltipItem } from "chart.js";
Chart.register(...registerables);

export default defineComponent({
  name: "UserStatsLineChart",
  components: {
    LineChart, // Register LineChart
  },
  props: {
    wpmData: {
      type: Array,
      required: true,
      validator: (value: any[]) => {
        console.log("Validating wpmData:", value); // Debug log
        return value.every((item) => typeof item === "number" || item === null);
      },
    },
    grossWpmData: {
      type: Array,
      required: true,
      validator: (value: any[]) =>
        value.every((item) => typeof item === "number" || item === null),
    },
    accuracyData: {
      type: Array,
      required: true,
      validator: (value: any[]) =>
        value.every((item) => typeof item === "number" || item === null),
    },
  },
  setup(props) {
    const labels = Array.from(
      { length: props.wpmData.length },
      (_, i) => `${i + 1}`
    );

    const chartData = ref({
      labels,
      datasets: [
        {
          label: "WPM",
          data: props.wpmData as number[], // Cast to number[]
          borderColor: "#e69500",
          fill: true,
          backgroundColor: "rgba(230, 149, 0, 0.1)",
          pointStyle: "rectRounded",
          tension: 0.3,
        },
        {
          label: "Gross WPM",
          data: props.grossWpmData as number[], // Cast to number[]
          borderColor: "#38516b",
          fill: true,
          backgroundColor: "rgba(56, 81, 107, 0.5)",
          pointStyle: "rectRounded",
          tension: 0.3,
        },
      ],
    });

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
    });

    const accuracyChartData = ref({
      labels,
      datasets: [
        {
          type: "bar",
          label: "none",
          data: props.accuracyData as number[], // Use accuracyData prop
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
            text: "Games (#)",
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
/* If you have any styles, add them here */
</style>

<template>
  <div
    v-if="userSession"
    class="all-time-stats"
  >
    <UserStatsBarChartTotal
      :wpmHistogram="wpmHistogram"
      :grossWpmHistogram="grossWpmHistogram"
      :accuracyHistogram="accuracyHistogram"
      :individualWpmHistogram="individualWpmHistogram"
      :individualAccuracyHistogram="individualAccuracyHistogram"
      :totalGamesPlayedByUser="userTotalGamesPlayed"
      :totalTimePlayedByUser="userTotalTimePlayed"
    />
    <div class="text-sm mt-8">
      Note: WPM and accuracy statistics shown exclude rounds with accuracy of 50% or lower and do not include measurements from single word, keys or custom training. WPM statistic assumes average word length of 5 characters. Total games played and total time played include only finished games.
    </div>
    <div class="text-sm mt-20">
    </div>
  </div>
  <div
    v-else
    class="all-time-stats mt-30"
  >
    <h2>Login or Register to see Total Site Stats</h2>
  </div>
</template>

    
<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import UserStatsBarChartTotal from "./LineChartComponentTotal.vue";
import { supabase } from "../../supabase";
import { useStore } from "../../stores/store";

export default defineComponent({
  name: "TotalStats",
  components: {
    UserStatsBarChartTotal,
  },
  setup() {
    const store = useStore();

    const individualWpmHistogram = ref<number[]>([]);
    const individualAccuracyHistogram = ref<number[]>([]);
    const userTotalGamesPlayed = ref(0);
    const userTotalTimePlayed = ref(0);

    async function fetchIndividualUserStats() {
      let { data, error } = await supabase
        .from("profiles")
        .select("wpm_buckets, accuracy_buckets")
        .eq("id", store.userSession.user.id);

      if (data && !error && data.length > 0) {
        individualWpmHistogram.value = data[0].wpm_buckets;
        individualAccuracyHistogram.value = data[0].accuracy_buckets;
      } else {
        console.error("Error fetching individual user stats:", error);
      }
    }

    async function fetchAllUserStats() {
      let { data, error } = await supabase
        .from("total_games")
        .select("wpmbuckets, grosswpmbuckets, accuracybuckets");

      if (error) {
        console.error("Error fetching bucket data:", error);
        return;
      }

      // Assuming there is only one row in the total_games table
      if (data && data.length > 0) {
        wpmHistogram.value = data[0].wpmbuckets;
        grossWpmHistogram.value = data[0].grosswpmbuckets;
        accuracyHistogram.value = data[0].accuracybuckets;
      } else {
        console.error("No bucket data found or error occurred");
      }
    }

    async function fetchUserSpecificStats() {
      if (store.userSession) {
        let { data, error } = await supabase
          .from("profiles")
          .select("games_played, time_played")
          .eq("id", store.userSession.user.id);

        if (data && !error && data.length > 0) {
          userTotalGamesPlayed.value = data[0].games_played || 0;
          userTotalTimePlayed.value = data[0].time_played || 0; // assuming it's stored in milliseconds
        } else {
          console.error("Error fetching user specific stats:", error);
        }
      }
    }

    const wpmData = ref<number[]>([]);
    const grossWpmData = ref<number[]>([]);
    const accuracyData = ref<number[]>([]);
    const wpmHistogram = ref<number[]>([]);
    const grossWpmHistogram = ref<number[]>([]);
    const accuracyHistogram = ref<number[]>([]);

    const userSession = computed(() => store.userSession);

    // On component mount, retrieve stats
    onMounted(async () => {
      await fetchAllUserStats();
      await fetchIndividualUserStats();
      await fetchUserSpecificStats();
    });

    return {
      wpmData,
      grossWpmData,
      accuracyData,
      wpmHistogram,
      grossWpmHistogram,
      accuracyHistogram,
      userSession,
      individualWpmHistogram,
      individualAccuracyHistogram,
      userTotalGamesPlayed,
      userTotalTimePlayed,
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
    
<template>

  <div class="container">
    <div
      v-if="!userSession"
      class="mb-5"
    >
      <p class="font-bold">Note: You are not logged in and your progress is <span class="text-red-500">not</span> saved.</p>
    </div>
    <div class="level-squares-container">
      <div class="level-squares">
        <LevelSquare
          v-for="level in levels"
          :key="level"
          :levelNumber="level"
          :isUnlocked="isLevelUnlocked(level)"
          :isLastUnlocked="level === lastUnlockedLevel"
          @click="isLevelUnlocked(level) ? selectLevel(level) : null"
        />
      </div>
    </div>
  </div>
</template>
  
<script lang="ts">
import { defineComponent, computed, onMounted } from "vue";
import { useStore } from "../../stores/store";
import LevelSquare from "./CampaignLevels.vue";
import { LEVELS } from "../../components/GameConstants";

export default defineComponent({
  components: {
    LevelSquare,
  },
  setup() {
    const store = useStore();
    const userSession = computed(() => store.userSession);
    const levels = Array.from({ length: LEVELS }, (_, index) => index + 1);
    const lastUnlockedLevel = computed(() => store.lastUnlockedLevel);
    console.log(
      "last unlocked level in campaignlevelselector:",
      lastUnlockedLevel.value
    );

    // Update this method to set selectedLevel directly in the store
    const selectLevel = (levelNumber: number) => {
      store.setSelectedLevel(levelNumber);
    };

    const isLevelUnlocked = (level: number) => {
      return level <= lastUnlockedLevel.value;
    };

    onMounted(async () => {
      // important to have correct levels for logged in users
      await store.fetchLastUnlockedLevel();
      console.log(
        "last unlocked level in campaignlevelselector:",
        lastUnlockedLevel.value
      );
    });

    return {
      levels,
      selectLevel,
      isLevelUnlocked,
      lastUnlockedLevel,
      userSession,
    };
  },
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centers the inner container horizontally */
  align-items: center; /* Centers the inner container vertically */
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
}
.level-squares-container {
  display: flex;
  justify-content: center; /* Centers the inner container horizontally */
  align-items: center; /* Centers the inner container vertically */
}

.level-squares {
  display: flex;
  flex-wrap: wrap; /* Allows level squares to wrap onto the next line */
  justify-content: center; /* Centers items horizontally within the inner container */
  gap: 10px; /* You can set a gap between the items for spacing */
}
</style>
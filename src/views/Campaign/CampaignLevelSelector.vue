<!--
CampaignLevelSelector
- Integrates level selector component
-->

<template>
  <div class="container">
    <div
      v-if="!userSession"
      class="mb-5"
    >
      <p class="font-bold">Note: You are not logged in and your progress is <span class="text-yellow-500">not</span> saved.</p>
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
import { LEVELS } from "../../components/GameLogic/GameConstants";

export default defineComponent({
  components: {
    LevelSquare,
  },
  setup() {
    const store = useStore();
    const userSession = computed(() => store.userSession);
    const levels = Array.from({ length: LEVELS }, (_, index) => index + 1);
    const lastUnlockedLevel = computed(() => store.lastUnlockedLevel);

    const selectLevel = (levelNumber: number) => {
      store.setSelectedLevel(levelNumber);
    };

    const isLevelUnlocked = (level: number) => {
      return level <= lastUnlockedLevel.value;
    };

    onMounted(async () => {
      // Fetch correct last unlocked level for user
      await store.fetchLastUnlockedLevel();
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
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}
.level-squares-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.level-squares {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
</style>
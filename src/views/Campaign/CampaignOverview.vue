<!--
CampaignOverview
Using Composition API
- Main Campaign page, starts on CampaignLevels overview
- Includes level overview and campaign games
-->
<template>

  <div class="level-selection">
    <LevelSelector @levelSelected="selectLevel" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "../../stores/store";
import { useRouter } from "vue-router";
import LevelSelector from "./CampaignLevelSelector.vue";
import { LEVELS } from "../../components/GameConstants";

export default defineComponent({
  components: {
    LevelSelector,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const userSession = computed(() => store.userSession);

    const lastUnlockedLevel = computed(() => store.lastUnlockedLevel);

    const selectLevel = (levelNumber: number) => {
      store.setSelectedLevel(levelNumber);
      router.push(`/campaign/level/${levelNumber}`);
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      // only works if the lastunlockedlevel is part of the level list
      if (event.key === "c" && !(lastUnlockedLevel.value > LEVELS)) {
        router.push(`/campaign/level/${lastUnlockedLevel.value}`);
      }
    };

    onMounted(() => {
      window.addEventListener("keydown", handleKeyPress);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    return {
      selectLevel,
      userSession,
    };
  },
});
</script>




<!-- CSS STYLING -->
<style scoped>
.level-selection {
  position: relative;
}
.message {
  align-self: center;
}
</style>

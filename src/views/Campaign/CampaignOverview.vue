<!--
CampaignOverview
- Component includes overview of available levels against computer opponent (playable if unlocked by user)
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
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "Campaign") return;

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

<style scoped>
.level-selection {
  position: relative;
}
</style>

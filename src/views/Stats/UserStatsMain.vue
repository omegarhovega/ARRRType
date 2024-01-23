<template>
  <div class="stats-container">
    <!-- Buttons for toggling views -->
    <div class="stats-topline">
      <button
        :class="{ 'active': currentView === 'AllTimeStats' }"
        @click="currentView = 'AllTimeStats'"
      >Your Last 100 Stats
      </button>
      <button
        :class="{ 'active': currentView === 'LastRoundStats' }"
        @click="currentView = 'LastRoundStats'"
      >Your Last Round Stats
        <div
          class="shortcut-key-small"
          style="left: calc(50% - 12px);"
        >←</div>
        <div
          class="shortcut-key-small"
          style="left: calc(50% + 12px);"
        >→</div>
      </button>

      <button
        :class="{ 'active': currentView === 'TotalStats' }"
        @click="currentView = 'TotalStats'"
      >Total Site Stats</button>
    </div>

    <div v-if="!userSession">
      <p class="font-bold">Note: You are not logged in and your statistics are <span class="text-yellow-500">not</span> saved.</p>
    </div>

    <!-- Dynamic Element -->
    <div class="mt-8">
      <transition
        name="fade"
        mode="out-in"
      >
        <component :is="currentViewComponent"></component>
      </transition>
    </div>
  </div>
</template>


<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
} from "vue";
import type { Component } from "vue";
import AllTimeStats from "./AllTimeStats.vue";
import LastRoundStats from "./LastRoundStats.vue";
import TotalStats from "./TotalStats.vue";
import { useRouter } from "vue-router";
import { useStore } from "../../stores/store";

export default defineComponent({
  name: "UserStatsMain",
  components: {
    AllTimeStats,
    LastRoundStats,
    TotalStats,
  },
  props: {
    initialView: {
      type: String,
      default: "AllTimeStats",
    },
  },
  setup(props) {
    const router = useRouter();

    const currentView = ref(props.initialView);
    const viewNames = ["AllTimeStats", "LastRoundStats", "TotalStats"];
    const store = useStore();
    const userSession = computed(() => store.userSession);

    const currentViewComponent = computed<Component | null>(() => {
      switch (currentView.value) {
        case "AllTimeStats":
          return AllTimeStats;
        case "LastRoundStats":
          return LastRoundStats;
        case "TotalStats":
          return TotalStats;
        default:
          return null;
      }
    });

    function handleKeyPress(event: KeyboardEvent) {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute == "Stats" || currentRoute == "LastRoundStats") {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
          return;
        }
        let currentIndex = viewNames.indexOf(currentView.value);
        if (event.key === "ArrowLeft") {
          currentIndex =
            (currentIndex - 1 + viewNames.length) % viewNames.length;
        } else if (event.key === "ArrowRight") {
          currentIndex = (currentIndex + 1) % viewNames.length;
        }
        currentView.value = viewNames[currentIndex];
      } else {
        return;
      }
    }

    onMounted(() => {
      window.addEventListener("keydown", handleKeyPress);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    return {
      currentView,
      currentViewComponent,
      userSession,
    };
  },
});
</script>


<style scoped>
.stats-topline {
  margin-bottom: 10px;
}
.stats-container {
  margin-left: auto;
  margin-right: auto;
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Align content to the start of the container */
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Adjusting for dynamic height */
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

/* Transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Active button style */
.active {
  background-color: #007bff;
  color: white;
}
button {
  position: relative;
}
.shortcut-key-small {
  position: absolute;
  top: 0px; /* Aligns the top edge of the element at the vertical middle of the parent */
  left: 50%; /* Aligns the left edge of the element at the horizontal middle of the parent */
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: linear-gradient(to bottom, #f2f2f2, #ccc);
  color: #000;
  border-radius: 3px;
  border: 1px solid white;
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.2), 0px 2px 2px rgba(0, 0, 0, 0.1),
    inset 0px -1px 1px rgba(255, 255, 255, 0.9);
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  line-height: 1;
  padding-bottom: 2px;
  margin-bottom: -2px;
}
</style>

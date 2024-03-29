<!--
CampaignModeSelector
- Allows player to choose between campaign against computer or other human players
-->

<template>
  <div class="training-mode-selector">
    <div class="mode-boxes-container">
      <div
        class="training-mode-box"
        @click="navigate('Campaign')"
      >
        <img
          src="/Computer.webp"
          alt="Random words"
          class="mode-image"
        />
        <p class="bold-text"><span class="underline text-yellow-500">C</span>omputer Pirates</p>
        <p class="option-description">Campaign against computer generated Pirates and level up your rank</p>
        <div class="winnings-description">
          <p class="bold-text">Match win:</p>
          <div>
            <img
              src="/coins_p.webp"
              alt="Doubloons"
            > Doubloons
          </div>
          <div>
            <img
              src="/parrot_p.webp"
              alt="Rank"
            > New rank
          </div>
        </div>
      </div>
      <div
        class="training-mode-box"
        @click="navigate('OnlineLobby')"
      >
        <img
          src="/PlayervPlayer.webp"
          alt="Mistakes"
          class="mode-image"
        />
        <p class="bold-text"><span class="underline text-yellow-500">H</span>uman Pirates</p>
        <p class="option-description">Fight other human Pirates with some good old hand to hand combat</p>
        <div class="winnings-description">
          <p class="bold-text">Match win:</p>
          <div>
            <img
              src="/coins_p.webp"
              alt="Doubloons"
            > Doubloons
          </div>
          <div>
            &nbsp;
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script lang="ts">
import { defineComponent, computed, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "../../stores/store";
import { useRouter } from "vue-router";

export default defineComponent({
  setup() {
    // Router initialization
    const router = useRouter();

    // Pinia store
    const store = useStore();
    const userSession = computed(() => store.userSession);

    // keyboard navigation shortcuts
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "CampaignMode") return;

      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key === "c") {
        navigate("Campaign");
      } else if (event.key === "h") {
        navigate("OnlineLobby");
      }
    };

    const navigate = (routeName: string) => {
      router.push({ name: routeName });
    };

    onMounted(async () => {
      window.addEventListener("keydown", handleKeyPress);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    return {
      userSession,
      navigate,
    };
  },
});
</script>
  
<style scoped>
.training-mode-selector {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--menu-height));
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

.mode-boxes-container {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  width: 100%;
}

@media (max-width: 1199px) {
  .mode-boxes-container {
    flex-wrap: wrap; /* Allows items to wrap if the viewport is less than 1200px wide */
  }
}

.training-mode-box {
  position: relative;
  text-align: center;
  cursor: pointer;
  width: 25%;
  max-width: 300px;
  padding: 10px;
}

.training-mode-box p {
  white-space: normal;
  word-wrap: break-word;
  text-align: center;
  margin: 0 auto;
}

.mode-image {
  /* Allows dynamic resizing to a certain point when screen width reduced */
  max-width: 300px;
  width: 100%;
  height: auto;
  border-radius: 12px;
}

@media (max-width: 1199px) {
  .training-mode-box {
    width: 48%; /* Larger width when fewer items per row */
  }
}

@media (max-width: 768px) {
  .training-mode-box {
    width: 100%; /* Full width for smaller screens */
  }
}

.bold-text {
  margin-top: 5px;
  font-weight: bold;
}
.option-description {
  font-size: 12px;
  text-align: center;
  margin-top: 5px;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
}

.winnings-description {
  font-size: 12px;
  padding-top: 5px;
  padding-bottom: 5px;
  max-width: 300px;
  margin-top: 10px;
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
  background: #2d4053;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.winnings-description > div {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
}

.winnings-description img {
  width: 15px;
  height: auto;
  vertical-align: middle;
  margin-right: 5px;
}
</style>

<template>
  <div
    v-if="isOpen"
    class="settings-overlay"
    @click="handleOverlayClick"
  >
    <div class="settings-box">
      <!-- Close Button -->
      <span
        class="close-button text-yellow-500"
        @click="closeSettings"
      >&times;</span>
      <!-- Tabs for different settings -->
      <div class="tabs">
        <button
          :class="{ 'active-tab': selectedTab === 'Train' }"
          @click="selectedTab = 'Train'"
        >Train</button>
        <button
          :class="{ 'active-tab': selectedTab === 'General' }"
          @click="selectedTab = 'General'"
        >
          General
        </button>
      </div>

      <!-- Settings menu content for different tabs -->
      <div class="mt-5">
        <!-- Content for 'Train' tab -->
        <div
          v-if="selectedTab === 'Train'"
          class="tab-content"
        >
          <div class="setting-item">
            <div>
              <label
                for="opponent-toggle"
                class="label"
              >Add Opponent&nbsp;</label>
              <input
                id="opponent-toggle"
                type="checkbox"
                v-model="opponentEnabled"
                @change="updateOpponentEnabled"
                class="toggle-switch"
              />
            </div>
            <div class="setting-description">Show virtual opponent in game</div>
          </div>

          <!-- This part should only be visible if 'opponentEnabled' is true -->
          <div
            v-if="opponentEnabled"
            class="setting-item"
          >
            <div>
              <label
                for="opponent-speed"
                class="label"
              >Opponent Speed&nbsp;</label>
              <select
                id="opponent-speed"
                v-model="opponentWPM"
                class="selector text-gray-500"
              >
                <option
                  v-for="wpm in wpmOptions"
                  :key="wpm"
                  :value="wpm"
                >{{ wpm }}</option>
              </select>
            </div>
            <div class="setting-description">Set virtual opponent speed (WPM)</div>
          </div>

          <div
            v-if="showRandomizationToggle"
            class="setting-item"
          >
            <div>
              <label
                for="randomization-toggle"
                class="label"
              >Add Symbols&nbsp;</label>
              <input
                id="randomization-toggle"
                type="checkbox"
                v-model="randomizationEnabled"
                @change="updateRandomizationStatus"
                class="toggle-switch"
              />
            </div>
            <div class="setting-description">Add upper case letters and random symbols to text for increased difficulty</div>
          </div>

          <div class="setting-item">
            <div>
              <label
                for="correction-to-end-game"
                class="label"
              >Force Correction&nbsp;</label>
              <input
                id="correction-to-end-game"
                type="checkbox"
                v-model="noGameEndWithoutMistakeCorrection"
                @change="updateForceMistakeCorrection"
                class="toggle-switch"
              />
            </div>
            <div class="setting-description">Only finish game if all characters have been correctly typed by player</div>
          </div>

          <div class="setting-item">
            <div>
              <label
                for="number-of-words"
                class="label"
              >Words&nbsp;</label>
              <select
                id="number-of-words"
                v-model="numberOfWords"
                class="selector  text-gray-500"
                @change="updateNumberOfWords"
              >
                <option
                  v-for="number in numberOfWordsOptions"
                  :key="number"
                  :value="number"
                >
                  {{ number }}
                </option>
              </select>
            </div>
            <div class="setting-description">Set number of words in a game</div>
          </div>
        </div>

        <!-- Content for 'General' tab -->
        <div
          v-if="selectedTab === 'General'"
          class="tab-content"
        >
          <div class="setting-item">
            <div>
              <label
                for="progress-toggle"
                class="label"
              >Show Player Progress&nbsp;</label>
              <input
                id="progress-toggle"
                type="checkbox"
                v-model="progressEnabled"
                @change="updateProgressEnabled"
                class="toggle-switch"
              />
            </div>
            <div class="setting-description">Display player progress bar during game</div>
          </div>
          <!-- Placeholder for additional General settings -->
        </div>

      </div>
    </div>
  </div>
</template>

  
  <script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import { useStore } from "../stores/store";

export default defineComponent({
  emits: [
    "progressChanged",
    "opponentWpmChanged",
    "numberOfWordsChanged",
    "opponentStatusChanged",
    "randomizationStatusChanged",
    "endGameStatusChanged",
    "forceMistakeCorrectionChanged",
    "close-settings",
  ],
  props: {
    isOpen: Boolean,
  },
  setup(props, { emit }) {
    const store = useStore();
    const selectedTab = ref("Train");

    // State variables and computed properties from TrainSubMenu
    const progressEnabled = computed({
      get: () => store.progressEnabled,
      set: (value) => {
        store.setProgressEnabled(value);
        emit("progressChanged", value); // Emit the status immediately after setting it
      },
    });

    const updateProgressEnabled = () => {
      emit("progressChanged", opponentEnabled.value);
    };

    // State variables and computed properties from TrainSubMenu
    const opponentEnabled = computed({
      get: () => store.opponentEnabled,
      set: (value) => {
        store.setOpponentEnabled(value);
        emit("opponentStatusChanged", value); // Emit the status immediately after setting it
      },
    });

    const updateOpponentEnabled = () => {
      emit("opponentStatusChanged", opponentEnabled.value);
    };

    const opponentWPM = computed({
      get: () => store.opponentWPM,
      set: (value) => {
        store.setOpponentWPM(value); // This will also update localStorage
      },
    });

    const wpmOptions = ref(Array.from({ length: 18 }, (_, i) => 30 + i * 10));

    const updateOpponentWPM = () => {
      // Emitting the opponentWpmChanged event to the parent component
      emit("opponentWpmChanged", opponentWPM.value);
    };

    // Randomization Enabled
    const randomizationEnabled = computed({
      get: () => store.randomizationEnabled,
      set: (value) => {
        store.setRandomizationEnabled(value);
        emit("randomizationStatusChanged", value);
      },
    });

    // Update Randomization Status
    const updateRandomizationStatus = () => {
      emit("randomizationStatusChanged", randomizationEnabled.value);
    };

    const showRandomizationToggle = computed(() => {
      return (
        store.selectedMode === "random" ||
        store.selectedMode === "words" ||
        store.selectedMode === "keys"
      );
    });

    // No Game End Without Mistake Correction
    const noGameEndWithoutMistakeCorrection = computed({
      get: () => store.noGameEndWithoutMistakeCorrection,
      set: (value) => {
        store.setNoEndGameWithoutCorrectionEnabled(value);
        emit("endGameStatusChanged", value);
      },
    });

    const updateNoEndGameWithoutCorrectionEnabled = () => {
      emit("endGameStatusChanged", noGameEndWithoutMistakeCorrection.value);
    };

    const updateForceMistakeCorrection = () => {
      emit(
        "forceMistakeCorrectionChanged",
        noGameEndWithoutMistakeCorrection.value
      );
    };

    const numberOfWords = computed({
      get: () => store.numberOfWords,
      set: (value) => {
        store.setNumberOfWords(value); // This will also update localStorage
      },
    });
    const numberOfWordsOptions = ref(
      Array.from({ length: 8 }, (_, i) => 30 + i * 10)
    );

    const updateNumberOfWords = () => {
      // Emitting the opponentWpmChanged event to the parent component
      emit("numberOfWordsChanged", numberOfWords.value);
    };

    const closeSettings = () => {
      emit("close-settings");
    };

    const handleOverlayClick = (event: any) => {
      // Check if the clicked element is the overlay itself
      if (event.target.classList.contains("settings-overlay") && props.isOpen) {
        closeSettings();
      }
    };

    const handleEscapePress = (event: any) => {
      if (event.key === "Escape" && props.isOpen) {
        // Check if Escape is pressed and menu is open
        closeSettings();
      }
    };

    onMounted(() => {
      window.addEventListener("keydown", handleEscapePress);
      const storedState = JSON.parse(localStorage.getItem("store") ?? "{}");
      if (storedState.opponentEnabled !== undefined) {
        opponentEnabled.value = storedState.opponentEnabled;
      }
      if (storedState.noGameEndWithoutMistakeCorrection !== undefined) {
        noGameEndWithoutMistakeCorrection.value =
          storedState.noGameEndWithoutMistakeCorrection;
      }
    });

    onUnmounted(() => {
      window.removeEventListener("keydown", handleEscapePress);
    });

    return {
      selectedTab,
      opponentEnabled,
      opponentWPM,
      wpmOptions,
      updateOpponentWPM,
      randomizationEnabled,
      updateRandomizationStatus,
      noGameEndWithoutMistakeCorrection,
      updateNoEndGameWithoutCorrectionEnabled,
      showRandomizationToggle,
      closeSettings,
      updateOpponentEnabled,
      updateForceMistakeCorrection,
      updateNumberOfWords,
      numberOfWordsOptions,
      numberOfWords,
      handleOverlayClick,
      progressEnabled,
      updateProgressEnabled,
    };
  },
});
</script>
  
<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100000;
  background-color: rgba(
    0,
    0,
    0,
    0.5
  ); /* Semi-transparent background for the full overlay */
}

.settings-box {
  background-color: #2d4053;
  border-radius: 10px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  padding: 20px;
  min-height: 500px;
  max-width: 600px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.tab-content {
  display: grid;
  grid-gap: 10px; /* Space between grid items */
  align-items: center;
}

.active-tab {
  background-color: #ecc94b;
  color: black;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-item > * {
  flex: 1;
}

.setting-description {
  text-align: left;
  color: #d5ddd7;
  font-size: 0.8em;
  margin-left: 10px;
  margin-right: 10px;
}

.selector,
.toggle-switch {
  justify-self: start;
}

.label {
  grid-column: 1;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  font-size: 24px;
  z-index: 100001;
}
</style>
  
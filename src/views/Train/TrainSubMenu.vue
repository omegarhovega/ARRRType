<!--
TrainSubMenu
- Allows to set opponent (progress visible) and opponent speed
-->
<template>
  <div class="sub-menu-container">
    <div class="train-sub-menu w-2/3 mx-auto flex items-end py-4">
      <div class="flex items-center mr-4">
        <label
          for="opponent-toggle"
          class="text-lg ml-2 mb-1"
        >Opponent&nbsp;</label>
        <input
          id="opponent-toggle"
          type="checkbox"
          v-model="opponentEnabled"
          @change="updateOpponentWPM"
          @keydown.space.prevent
          class="toggle-switch"
        />
      </div>
      <label
        for="opponent-speed"
        class="text-lg ml-2 mb-1"
        v-if="opponentEnabled"
      >Speed:</label>
      <select
        id="opponent-speed"
        style="background-color: #2d4053; color: #d5ddd7"
        class="text-lg ml-2 mb-1"
        v-model="opponentWPM"
        @change="updateOpponentWPM"
        v-if="opponentEnabled"
      >
        <option
          v-for="wpm in wpmOptions"
          :key="wpm"
          :value="wpm"
        >
          {{ wpm }}
        </option>
      </select>
      <div
        class="flex items-center ml-4"
        v-if="showRandomizationToggle"
      >
        <label
          for="randomization-toggle"
          class="text-lg ml-2 mb-1"
        >Symbols&nbsp;</label>
        <input
          id="randomization-toggle"
          type="checkbox"
          v-model="randomizationEnabled"
          @change="updateRandomizationStatus"
          @keydown.space.prevent
          class="toggle-switch"
        />
      </div>
      <div class="flex items-center ml-4">
        <label
          for="correction-to-end-game"
          class="text-lg ml-2 mb-1"
        >Force Correction&nbsp;</label>
        <input
          id="correction-to-end-game"
          type="checkbox"
          v-model="noGameEndWithoutMistakeCorrection"
          @change="updateNoEndGameWithoutCorrectionEnabled"
          @keydown.space.prevent
          class="toggle-switch"
        />
      </div>
      <!-- number of words selection -->
      <div
        class="flex items-center ml-4"
        v-if="showRandomizationToggle"
      >
        <label
          for="number-of-words"
          class="text-lg ml-2 mb-1"
        >Words:</label>
        <select
          id="number-of-words"
          style="background-color: #2d4053; color: #d5ddd7"
          class="text-lg ml-2 mb-1"
          v-model="numberOfWords"
          @change="updateNumberOfWords"
        >
          <option
            v-for="numberOfWords in numberOfWordsOptions"
            :key="numberOfWords"
            :value="numberOfWords"
          >
            {{ numberOfWords }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import { useStore } from "../../stores/store";

export default defineComponent({
  emits: [
    "opponentWpmChanged",
    "numberOfWordsChanged",
    "opponentStatusChanged",
    "randomizationStatusChanged",
    "endGameStatusChanged",
    "forceMistakeCorrectionChanged",
  ],
  setup(_, { emit }) {
    const store = useStore();

    const opponentEnabled = computed({
      get: () => store.opponentEnabled,
      set: (value) => {
        store.setOpponentEnabled(value);
        emit("opponentStatusChanged", value); // Emit the status immediately after setting it
      },
    });

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

    const showRandomizationToggle = computed(() => {
      return (
        store.selectedMode === "random" ||
        store.selectedMode === "words" ||
        store.selectedMode === "keys"
      );
    });

    const randomizationEnabled = computed({
      get: () => store.randomizationEnabled,
      set: (value) => {
        store.setRandomizationEnabled(value);
      },
    });

    const updateRandomizationStatus = () => {
      emit("randomizationStatusChanged", randomizationEnabled.value);
    };

    const noGameEndWithoutMistakeCorrection = computed({
      get: () => store.noGameEndWithoutMistakeCorrection,
      set: (value) => {
        store.setNoEndGameWithoutCorrectionEnabled(value);
        emit("endGameStatusChanged", value);
      },
    });

    const updateNoEndGameWithoutCorrectionEnabled = () => {
      localStorage.setItem(
        "noGameEndWithoutMistakeCorrection",
        JSON.stringify(noGameEndWithoutMistakeCorrection.value)
      );
    };

    const forceMistakeCorrection = computed({
      get: () => store.forceMistakeCorrection,
      set: (value) => {
        store.setForceMistakeCorrection(value);
        emit("forceMistakeCorrectionChanged", value);
      },
    });

    // Retrieve the state from localStorage when the component is mounted
    onMounted(() => {
      const storedValue = localStorage.getItem(
        "noGameEndWithoutMistakeCorrection"
      );
      if (storedValue !== null) {
        store.setNoEndGameWithoutCorrectionEnabled(JSON.parse(storedValue));
      }
    });

    return {
      opponentEnabled,
      opponentWPM,
      wpmOptions,
      updateOpponentWPM,
      showRandomizationToggle,
      randomizationEnabled,
      updateRandomizationStatus,
      noGameEndWithoutMistakeCorrection,
      updateNoEndGameWithoutCorrectionEnabled,
      forceMistakeCorrection,
      numberOfWords,
      updateNumberOfWords,
      numberOfWordsOptions,
    };
  },
});
</script>

<style scoped>
.sub-menu-container {
  position: absolute;
  top: 70px;
  left: 0;
  width: 100%;
  z-index: 101;
}
.toggle-switch {
  appearance: none;
  width: 40px;
  height: 20px;
  background-color: #4d7094;
  outline: none;
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.toggle-switch:checked {
  background-color: #4d7094;
  opacity: 0.7;
}

.toggle-switch::before {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  background-color: #2c3a4d;
  border-radius: 50%;
  top: 1px;
  left: 1px;
  transition: left 0.3s ease;
}

.toggle-switch:checked::before {
  left: 21px;
}
</style>

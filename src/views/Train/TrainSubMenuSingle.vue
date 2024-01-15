<!--
TrainSubMenu
- Allows to set opponent (progress visible) and opponent speed
-->
<template>
  <div class="sub-menu-container">
    <div class="train-sub-menu-single w-2/3 mx-auto flex items-end py-4">
      <div class="flex items-center ml-4">
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
      <!-- number of words selection -->
      <div class="flex items-center ml-4">
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
  emits: ["numberOfWordsChanged", "randomizationStatusChanged"],
  setup(_, { emit }) {
    const store = useStore();

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
      return store.selectedMode === "random" || store.selectedMode === "words";
    });

    const randomizationEnabled = computed({
      get: () => store.randomizationEnabled,
      set: (value) => {
        store.setRandomizationEnabled(value);
        emit("randomizationStatusChanged", value);
      },
    });

    const updateRandomizationStatus = () => {
      // currently not in use
    };

    // Retrieve the state from localStorage when the component is mounted
    onMounted(() => {});

    return {
      showRandomizationToggle,
      randomizationEnabled,
      updateRandomizationStatus,
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

<template>
  <!-- Results overlay -->
  <div
    v-if="showResultsOverlay"
    id="overlay"
    @keyup="handleKeyPress($event)"
  >
    <div
      id="wpm-stat"
      class="text-xl"
    >
      <div class="image-container">
        <img
          :src="wpm > opponentWpmLevel ? '/parrot_p.png' : '/skull_p.png'"
          alt="Result Icon"
          width="30"
          height="30"
        />
        <!-- Shows different image depending whether player won or lost -->
      </div>
      <p>{{ resultMessage }}</p>
      <p class="mt-5">Your Lives: {{ livesPlayer }}</p>
      <p>Opponent Lives: {{ livesOpponent }}</p>
      <p class="mt-5">Your WPM: {{ wpm }} (Accuracy: {{ accuracy }}%)</p>
      <p>Opponent WPM: {{ opponentWpmLevel }}</p>
      <p class="mt-5">Time: {{ timeDifference }}</p>
      <p>Keystrokes: {{ totalKeystrokes }}</p>
      <p
        v-if="displayAccuracyWarning"
        class="mt-5"
      >Note: Results are not saved, accuracy is 50% or lower.</p>
      <div class="training-mode-box mt-7">
        <div class="shortcut-key text-base">Enter<span>&#9166;</span></div>
        <button
          v-if="!levelFinished"
          @click="handleNextRoundClick"
        >
          Next round
        </button>
        <button
          v-if="levelFinished"
          @click="backToOverview"
          @keyup.enter="backToOverview"
        >
          Return to overview
        </button>
      </div>
    </div>
  </div>
</template>
    
<script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "GameStatsCampaign",
  props: {
    showResultsOverlay: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
    isFinished: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
    levelFinished: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
    resultMessage: {
      type: String as PropType<string>,
      required: true,
    },
    wpm: {
      type: Number as PropType<number>,
      required: true,
    },
    livesPlayer: {
      type: Number as PropType<number>,
      required: true,
    },
    livesOpponent: {
      type: Number as PropType<number>,
      required: true,
    },
    opponentWpmLevel: {
      type: Number as PropType<number>,
      required: true,
    },
    grossWpm: {
      type: Number as PropType<number>,
      required: true,
    },
    accuracy: {
      type: Number as PropType<number>,
      required: true,
    },
    timeDifference: {
      type: String as PropType<string>,
      required: true,
    },
    totalKeystrokes: {
      type: Number as PropType<number>,
      required: true,
    },
    displayAccuracyWarning: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
    handleNextRoundClick: {
      type: Function as PropType<(payload: MouseEvent) => void>,
      required: true,
    },
    backToOverview: {
      type: Function as PropType<(payload: KeyboardEvent | MouseEvent) => void>,
      required: true,
    },
    handleKeyPress: {
      type: Function as PropType<(payload: KeyboardEvent) => void>,
      required: true,
    },
  },
});
</script>
  
<style scoped>
#overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background-color: #2d4053;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

#wpm-stat,
#wpm-placeholder {
  text-align: left;
}

.training-mode-box {
  position: relative;
  text-align: center;
  cursor: pointer;
}

.shortcut-key {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translate(-50%, 0);
  width: 65px;
  height: 20px;
  background: linear-gradient(to bottom, #f2f2f2, #ccc);
  color: #000;
  text-align: center;
  line-height: 20px;
  border-radius: 3px;
  border: 1px solid white;
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.2), 0px 2px 2px rgba(0, 0, 0, 0.1),
    inset 0px -1px 1px rgba(255, 255, 255, 0.9);
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
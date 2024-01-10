<template>
  <div
    id="game-text-display"
    class="text-xl mx-auto w-2/3"
  >
    <span
      v-for="(char, index) in gameText"
      :key="index"
      :class="getCharClass(index)"
      class="char"
      :ref="el => setCharSpan(el, index)"
    >
      {{ char }}
    </span>
  </div>
</template>
  
<script lang="ts">
import { defineComponent, watch } from "vue";
import type { PropType, ComponentPublicInstance } from "vue";

export default defineComponent({
  name: "GameTextDisplay",
  props: {
    gameText: {
      type: Array as PropType<string[]>,
      required: true,
    },
    typedText: {
      type: Object as PropType<Record<number, string>>,
      required: true,
      default: () => ({}),
    },
    currentCharIndex: {
      type: Number as PropType<number>,
      required: true,
    },
    charSpansDOM: {
      type: Array as PropType<(Element | ComponentPublicInstance)[]>,
      required: true,
    },
  },
  setup(props) {
    // Watch for changes in gameText and log it
    watch(
      () => props.gameText,
      (newGameText) => {
        console.log("Received gameText charSpans:", newGameText);
      },
      { immediate: true }
    );

    const setCharSpan = (
      el: Element | ComponentPublicInstance | null,
      index: number
    ) => {
      if (el && el instanceof HTMLElement) {
        props.charSpansDOM[index] = el;
      }
    };

    return { setCharSpan };
  },
  methods: {
    getCharClass(index: number): string {
      if (index < this.currentCharIndex) {
        if (this.typedText.hasOwnProperty(index)) {
          return this.typedText[index] === this.gameText[index]
            ? "correct"
            : this.typedText[index] !== " " && this.gameText[index] === " "
            ? "incorrectSpace"
            : "incorrect";
        }
        return ""; // Standard formatting for characters before the current index
      } else if (index === this.currentCharIndex) {
        return "current"; // Specific class for the current character
      }
      return ""; // Standard formatting for characters beyond the current index
    },
  },
});
</script>
  
<style scoped>
#game-text-display {
  width: 100%;
  white-space: normal;
  overflow-x: none;
}
.char {
  border-left: solid 1px transparent;
  color: #d5ddd7;
  position: relative;
  font-weight: 400;
  transition: background-color 1s ease;
  line-height: 30px;
}

.correct {
  color: #d5ddd7;
  opacity: 0.4;
}

.incorrect {
  color: red;
  border-bottom: 2px solid red;
  opacity: 0.25;
}

.incorrectSpace {
  border-bottom: 2px solid red;
  opacity: 0.25;
}
</style>
  
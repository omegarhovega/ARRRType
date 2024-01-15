<template>
  <div class="keyboard">
    <div
      v-for="row in keyboardRows"
      :key="row[0]"
      class="keyboard-row"
    >
      <div
        v-for="key in row"
        :key="key"
        :class="['key', key === ' ' ? 'space' : key]"
        :style="{ backgroundColor: getColorForKey(key) }"
      >
        {{ displayKey(key) }}
        <span class="accuracy">{{ getAccuracyForKey(key) }}%</span>
      </div>
    </div>
  </div>
</template>
  

  <script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "KeyboardHeatmap",
  props: {
    errorRates: {
      type: Object as PropType<Record<string, number>>,
      required: true,
    },
  },
  data() {
    return {
      keyboardRows: [
        // Row 1
        ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
        // Row 2
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
        // Row 3
        ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
        // Row 4
        ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
        // Spacebar
        [" "],
      ],
    };
  },
  methods: {
    // color coding depening on error rate
    getColorForKey(key: string) {
      const errorRate = this.errorRates[key] || 0;
      const scaledAlpha = Math.min(1, errorRate * 10);
      return `rgba(56, 81, 107, ${scaledAlpha})`;
    },
    getAccuracyForKey(key: string) {
      const errorRate = this.errorRates[key] || 0;
      const accuracy = Math.round((1 - errorRate) * 100);
      return accuracy;
    },
    displayKey(key: string) {
      if (key === " ") {
        return "Space";
      }
      return key;
    },
  },
});
</script>
  
<style scoped>
.key {
  display: inline-block;
  padding: 10px 15px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 5px;
  transition: background-color 0.3s;
  position: relative;
}

.key .accuracy {
  position: absolute;
  bottom: 0px;
  right: 2px;
  font-size: 10px;
  color: #ddd;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
}

.key {
  display: inline-block;
  padding: 10px 15px;
  margin: 0 5px;
  border: 1px solid #ddd;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.key.space {
  width: 200px;
  text-align: center;
}
</style>
  



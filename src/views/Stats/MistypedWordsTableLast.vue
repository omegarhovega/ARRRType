<template>
  <div
    class="wordmap"
    v-for="word in lastRoundMistypedWords"
    :key="word"
  >
    {{ word }}
  </div>
</template>
  
<script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "MistypedWordsTableLast",
  props: {
    lastRoundMistypedWords: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },
});
</script>

<style scoped>
.wordmap {
  display: inline-block;
  padding: 10px 15px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 5px;
  transition: background-color 0.3s;
  position: relative;
}
</style>

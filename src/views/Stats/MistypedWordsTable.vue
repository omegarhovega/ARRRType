<template>

  <div
    class="wordmap"
    v-for="word in topMistypedWords"
    :key="word.text"
  >
    {{ word.text }}
  </div>
</template>
  
  <script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "MistypedWordsTable",
  props: {
    topMistypedWords: {
      type: Array as PropType<Array<{ text: string; frequency: number }>>,
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
  
<template>
  <div
    v-if="showCountdown"
    id="tooltip"
    class="absolute text-gray-700 py-1 px-3 rounded shadow-lg"
  >
    <template v-if="countdown > 0">
      {{ countdown }}
    </template>
    <template v-else-if="countdownFinished">
      <img
        src="/skull_p.webp"
        alt="Skull"
        width="22"
        height="22"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "CountdownTimer",
  props: {
    countdown: {
      type: Number as PropType<number>,
      required: true,
    },
    showCountdown: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
    countdownFinished: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
  },
});
</script>

<style scoped>
#tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  margin-bottom: 10px;
  z-index: 100;
  background-color: #e6b800;
  border-radius: 10px;
  color: black;
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
}

#countdown {
  text-align: left;
}
</style>
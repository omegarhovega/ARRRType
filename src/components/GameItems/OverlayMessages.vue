<template>
  <!-- Capslock is on overlay -->
  <div
    v-if="isCapsLockOn"
    id="capslock-overlay"
  >
    <div class="message">Caps Lock is on</div>
  </div>
  <div
    v-if="hasMistake"
    id="mistake-overlay"
  >
    <div class="message">Uncorrected mistake!</div>
  </div>
  <div
    v-if="isFinished"
    id="wpm-placeholder"
    class="text-left"
  >
    <h2 class="text-xl">&nbsp;</h2>
  </div>
</template>
  
  <script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "CountdownTimer",
  props: {
    isCapsLockOn: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
    hasMistake: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
    isFinished: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
  },
});
</script>

<style scoped>
#mistake-overlay {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: auto;
  padding: 10px;
  background-color: #2d4053;
  color: rgb(205, 52, 52);
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
#capslock-overlay {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  width: auto;
  padding: 10px;
  background-color: #2d4053;
  color: rgb(205, 52, 52);
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
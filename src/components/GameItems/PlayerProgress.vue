<template>
  <div
    v-if="!loading"
    class="player-progress w-2/3 mx-auto mb-10"
  >
    <div class="label text-[#d5ddd7]">Player:</div>
    <div class="flex-grow relative h-6">
      <div class="progress-bar absolute inset-0 bg-[#2d4053]"></div>
      <div
        class="absolute inset-0 bg-[#40578f]/[.6]"
        :style="{ width: progress + '%' }"
      >
        <span class="absolute inset-0 right-0 w-full text-center">{{ progress.toFixed(1) }}%</span>
        <div class="ship-image absolute bottom-0 right-0">
          <img
            :src="randomImage"
            alt="Player Icon"
            class="w-auto h-6"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "PlayerProgress",
  props: {
    progress: {
      type: Number as PropType<number>,
      required: true,
    },
    loading: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
  },
  setup(props) {
    const imageList = ["/ship_p.webp", "/parrot_p.webp", "/skull_p.webp"];

    const randomImage = computed(() => {
      const randomIndex = Math.floor(Math.random() * imageList.length);
      return imageList[randomIndex];
    });

    return { randomImage };
  },
});
</script>

  
<style scoped>
.player-progress {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.label {
  width: 90px;
  text-align: right;
  margin-right: 10px;
}

.ship-image {
  transition: right 0.5s ease-in-out;
}
</style>

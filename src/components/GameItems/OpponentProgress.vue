<template>
  <div
    v-if="!loading"
    class="w-2/3 mx-auto"
  >
    <div
      v-for="opponent in opponents"
      :key="opponent.id"
    >
      <div class="flex items-center mb-3">
        <div class="label mr-2 text-right text-[#d5ddd7]">{{ opponent.name }}:</div>
        <div class="flex-grow h-6 relative">
          <div class="absolute inset-0 bg-[#2d4053]"></div>
          <div
            class="absolute inset-0 bg-[#ffcc00]/50"
            :style="{ width: opponent.progress + '%' }"
          >
            <span class="absolute inset-0 w-full text-center">{{ opponent.progress.toFixed(1) }}%</span>
            <div class="ship-image absolute bottom-0 right-0">
              <img
                :src="randomImage"
                alt="Opponent Icon"
                class="w-auto h-6"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script lang="ts">
import { defineComponent, computed } from "vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "OpponentProgress",
  props: {
    opponents: {
      type: Array as PropType<
        Array<{ id: string; name: string; progress: number }>
      >,
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
.label {
  width: 90px;
  text-align: right;
  margin-right: 10px;
}
.ship-image {
  transition: right 0.5s ease-in-out;
}
</style>
  
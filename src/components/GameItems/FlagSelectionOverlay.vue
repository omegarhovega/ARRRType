<template>
  <div
    v-if="show"
    class="overlay"
  >
    <div class="flags">
      <!-- Loop over avatar IDs and display each avatar image -->
      <img
        v-for="flagId in flagIds"
        :key="flagId"
        :src="`/flags/Flag${flagId}.webp`"
        @click="selectFlag(flagId)"
        alt="Flag Image"
      />
    </div>
    <div class="button-box mt-5">
      <button @click="close">
        <div class="shortcut-key-small">C</div>Close
      </button>
    </div>
  </div>
</template>
  
  <script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: {
    show: Boolean,
  },
  emits: ["update-flag", "close-overlay"],
  setup(props, { emit }) {
    const flagIds = ref(Array.from({ length: 143 }, (_, i) => i + 1));

    function selectFlag(flagId: number) {
      emit("update-flag", flagId); // Emit the selected avatar ID
    }

    function close() {
      emit("close-overlay"); // Tell the parent component to close the overlay
    }

    return {
      flagIds,
      selectFlag,
      close,
    };
  },
});
</script>
  

  
<style scoped>
.overlay {
  position: fixed;
  z-index: 101;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.flags {
  max-width: 80%; /* Set the maximum width to 80% */
  margin: 0 auto; /* Center horizontally */
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background-color: #2d4053; /* Or any other color */
  border-radius: 5px;
  padding: 20px;
  align-items: center;
}

.flags img {
  height: 20px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.flags img:hover {
  transform: scale(1.1);
}

.button-box {
  position: relative;
  display: inline-block;
  text-align: left; /* Align items to the left */
  width: 100%; /* Take full width to sit below avatars */
  text-align: center;
}

.button {
  position: relative;
}

.shortcut-key-small {
  top: -10px;
  left: 50%;
  transform: translate(-50%, 0);
  position: absolute;
  width: 20px;
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

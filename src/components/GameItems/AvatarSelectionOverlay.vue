<template>
  <div
    v-if="show"
    class="overlay"
  >
    <div class="avatars">
      <!-- Loop over avatar IDs and display each avatar image -->
      <img
        v-for="avatarId in avatarIds"
        :key="avatarId"
        :src="`/avatars/Head${avatarId}.png`"
        @click="selectAvatar(avatarId)"
        alt="Avatar Image"
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
  emits: ["update-avatar", "close-overlay"],
  setup(props, { emit }) {
    const avatarIds = ref(Array.from({ length: 39 }, (_, i) => i + 1));

    function selectAvatar(avatarId: number) {
      emit("update-avatar", avatarId); // Emit the selected avatar ID
    }

    function close() {
      emit("close-overlay"); // Tell the parent component to close the overlay
    }

    return {
      avatarIds,
      selectAvatar,
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

.avatars {
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

.avatars img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.avatars img:hover {
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

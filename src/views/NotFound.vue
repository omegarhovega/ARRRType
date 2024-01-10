<template>
  <div class="not-found">
    <div>
      <img
        src="/404_p.png"
        alt="404"
        width="35"
        class="img"
      />
    </div>
    <p class="text">404</p>
    <p class="text">Page not found :-(</p>
    <button @click="goToStart">
      <div class="shortcut-key">S</div>Back to Start
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  setup() {
    const router = useRouter();

    const goToStart = () => {
      router.push("/");
    };

    const handleKeyPress = (event: any) => {
      if (event.key === "s") {
        goToStart();
      }
    };

    onMounted(() => {
      window.addEventListener("keydown", handleKeyPress);
    });

    onUnmounted(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    return {
      goToStart,
    };
  },
});
</script>


<style scoped>
.not-found {
  display: flex;
  flex-direction: column; /* Stack children vertically */
  justify-content: center; /* Centers items vertically */
  align-items: center; /* Centers items horizontally */
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  text-align: center; /* Center text horizontally */
}
.img {
  display: block;
  margin-bottom: 10px; /* Space between the image and the text */
}

.text {
  text-align: center; /* Ensure text is centered below the image */
  width: 100%; /* Full width to ensure centering */
}

button {
  position: relative;
  margin-top: 20px;
}
.shortcut-key {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
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

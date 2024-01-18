<template>
  <div class="text-selector">
    <div class="mt-10">
      <p>Paste your text here (max 1000 characters):</p>
      <textarea
        v-model="customText"
        placeholder="Input text..."
        maxlength="1000"
        class="custom-textarea mt-5"
        id="usertext"
      ></textarea>
    </div>
    <div class="mt-5">
      <div class="button-box">
        <div class="shortcut-key-small">Enter<span>&#9166;</span></div><button @click="submitCustomText">Start Custom Training</button>
      </div>
    </div>
  </div>
</template>
  
<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "../../stores/store";
import { useRouter } from "vue-router";

export default defineComponent({
  setup() {
    const customText = ref("");
    const store = useStore();
    const router = useRouter();

    const submitCustomText = () => {
      if (customText.value.trim().length > 0) {
        // Normalize the input: Replace newlines with spaces
        let normalizedText = customText.value.replace(/\r?\n|\r/g, " ");

        // Trim and replace double or more spaces with a single space
        normalizedText = normalizedText.replace(/\s\s+/g, " ");

        // Save custom text to local storage or Vuex store
        localStorage.setItem("customText", normalizedText);

        // Set training parameters for custom mode
        store.setTrainingParams("custom", "3");

        // Navigate to the training mode component
        router.push({ name: "TrainMode", params: { mode: "custom" } });
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key === "Enter") {
        submitCustomText();
      }
    };

    onMounted(async () => {
      window.addEventListener("keydown", handleKeyPress);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    return {
      customText,
      submitCustomText,
    };
  },
});
</script>
  
<style scoped>
.text-selector {
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}
.custom-textarea {
  width: 100%;
  height: 150px;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

.shortcut-key-small {
  top: -10px;
  left: 50%;
  transform: translate(-50%, 0);
  position: absolute;
  width: 65px;
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

.button-box {
  width: 100%;
  position: relative;
  display: inline-block;
  text-align: center;
}
</style>
  
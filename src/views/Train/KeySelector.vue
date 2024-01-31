<template>
  <div class="key-selector mt-5">
    <p>Select/deselect individual keys for your training text by clicking on them.</p>
    <div class="keyboard mt-5">
      <div
        v-for="row  in keyboardRows"
        :key="row[0]"
        class="keyboard-row"
      >
        <div
          v-for="key in row"
          :key="key"
          :class="['key', key === ' ' ? 'space' : '']"
          @click="toggleKey(key)"
          :style="{ backgroundColor: selectedKeys.includes(key) ? '#4caf50' : 'transparent' }"
        >
          {{ displayKey(key) }}
        </div>
      </div>
      <!-- Overlay for no key selected -->
      <div
        v-if="startAttempted && !isAnyKeySelected"
        class="overlay"
      >
        Please select at least one key.
      </div>
    </div>

    <!-- Key Group Shortcuts -->
    <div class="mt-5">
      <p>Select/deselect whole rows.</p>
      <div class="buttons-center mt-5">
        <div class="button-box">
          <button @click="selectKeyGroup('numbers')"><span class="underline text-yellow-500">N</span>umbers Row</button>
        </div>
        <div class="button-box ml-2">
          <button @click="selectKeyGroup('upper')"><span class="underline text-yellow-500">U</span>pper Row</button>
        </div>
        <div class="button-box ml-2">
          <button @click="selectKeyGroup('home')"><span class="underline text-yellow-500">H</span>ome Row</button>
        </div>
        <div class="button-box ml-2">
          <button @click="selectKeyGroup('lower')"><span class="underline text-yellow-500">L</span>ower Row</button>
        </div>
        <div class="button-box ml-2">
          <button @click="deselectAll"><span class="underline text-yellow-500">D</span>eselect All</button>
        </div>
      </div>
    </div>

    <!-- Start Game Button -->
    <div class="buttons-center mt-10">
      <div class="button-box">
        <button @click="startGame">
          <span class="underline text-yellow-500">S</span>tart Game
        </button>
      </div>
    </div>
  </div>
</template>
  
  
  
<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useRouter } from "vue-router";
import { useStore } from "../../stores/store";

export default defineComponent({
  setup() {
    const router = useRouter();
    const store = useStore();

    const isAnyKeySelected = computed(() => selectedKeys.value.length > 0);
    const startAttempted = ref(false);

    const keyboardRows = [
      // Row 1
      ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
      // Row 2
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
      // Row 3
      ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
      // Row 4
      ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
    ];

    const selectedKeys = ref<string[]>([]);

    const toggleKey = (key: string) => {
      const index = selectedKeys.value.indexOf(key);
      if (index >= 0) {
        selectedKeys.value.splice(index, 1);
      } else {
        selectedKeys.value.push(key);
      }
    };

    const selectKeyGroup = (group: string) => {
      const groupKeys: { [key: string]: string[] } = {
        numbers: keyboardRows[0],
        upper: keyboardRows[1],
        home: keyboardRows[2],
        lower: keyboardRows[3],
      };

      const selectedRow = groupKeys[group];
      const isRowFullySelected = selectedRow.every((key) =>
        selectedKeys.value.includes(key)
      );

      if (isRowFullySelected) {
        // Remove all keys in the row from selectedKeys
        selectedKeys.value = selectedKeys.value.filter(
          (key) => !selectedRow.includes(key)
        );
      } else {
        // Add missing keys in the row to selectedKeys
        selectedRow.forEach((key) => {
          if (!selectedKeys.value.includes(key)) {
            selectedKeys.value.push(key);
          }
        });
      }
    };

    const deselectAll = () => {
      selectedKeys.value = [];
    };

    const savedKeys = localStorage.getItem("selectedKeys");
    if (savedKeys) {
      selectedKeys.value = JSON.parse(savedKeys);
    }

    const startGame = () => {
      startAttempted.value = true;
      if (isAnyKeySelected.value) {
        // Save selected keys to local storage
        localStorage.setItem(
          "selectedKeys",
          JSON.stringify(selectedKeys.value)
        );

        // Set the training parameters in the store for "keys" mode
        store.setTrainingParams("keys", "3");

        // Navigate to the training mode component
        router.push({ name: "TrainMode", params: { mode: "keys" } });
      }
      // If no key is selected, the overlay will show up as startAttempted is now true
    };

    const displayKey = (key: string) => {
      if (key === " ") {
        return "Space";
      }
      return key;
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      // Check to ensure that shortcuts are not accidentally carried over to other components
      const currentRoute = router.currentRoute.value.name;

      if (currentRoute !== "KeySelector") return;

      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key === "s") {
        startGame();
      } else if (event.key === "n") {
        selectKeyGroup("numbers");
      } else if (event.key === "u") {
        selectKeyGroup("upper");
      } else if (event.key === "h") {
        selectKeyGroup("home");
      } else if (event.key === "l") {
        selectKeyGroup("lower");
      } else if (event.key === "d") {
        deselectAll();
      }
    };

    onMounted(async () => {
      window.addEventListener("keydown", handleKeyPress);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeyPress);
    });

    return {
      keyboardRows,
      selectedKeys,
      toggleKey,
      selectKeyGroup,
      startGame,
      displayKey,
      deselectAll,
      isAnyKeySelected,
      startAttempted,
    };
  },
});
</script>


<style scoped>
.keyboard {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
}

.key {
  display: inline-block;
  padding: 10px 15px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 5px;
  transition: background-color 0.3s;
  cursor: pointer; /* To indicate the keys are clickable */
  position: relative;
}

.buttons-center {
  text-align: center;
}

.overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
}

.button-box {
  position: relative;
  display: inline-block;
}
</style>



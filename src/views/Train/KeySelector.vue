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
          <div class="shortcut-key-small">N</div><button @click="selectKeyGroup('numbers')">Numbers Row</button>
        </div>
        <div class="button-box ml-2">
          <div class="shortcut-key-small">U</div><button @click="selectKeyGroup('upper')">Upper Row</button>
        </div>
        <div class="button-box ml-2">
          <div class="shortcut-key-small">H</div><button @click="selectKeyGroup('home')">Home Row</button>
        </div>
        <div class="button-box ml-2">
          <div class="shortcut-key-small">L</div><button @click="selectKeyGroup('lower')">Lower Row</button>
        </div>
        <div class="button-box ml-2">
          <div class="shortcut-key-small">D</div><button @click="deselectAll">Deselect All</button>
        </div>
      </div>
    </div>

    <!-- Start Game Button -->
    <div class="buttons-center mt-10">
      <div class="button-box">
        <button @click="startGame">
          <div class="shortcut-key-small">S</div>Start Game
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
      keyboardRows, // Updated to 'keyboardRows'
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

/* Style for the accuracy display, you can remove this if not needed */
.key .accuracy {
  position: absolute;
  bottom: 0px;
  right: 2px;
  font-size: 10px;
  color: #ddd;
}

/* Special styling for the space key */
.key.space {
  width: 200px;
  text-align: center;
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

.shortcut-key-small {
  top: -10px; /* Adjust as needed */
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

.button-box {
  position: relative;
  display: inline-block;
}
</style>



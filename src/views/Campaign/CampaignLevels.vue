<template>
  <div :class="{ 'level-square': true, locked: !isUnlocked }">
    <router-link
      v-if="isUnlocked"
      :to="`/campaign/level/${levelNumber}`"
    >
      <div v-if="isLastUnlocked">
        <div class="shortcut-key">C</div>
        <img
          :src="levelImagePath"
          alt="Level Image"
        />
      </div>
      <div v-if="!isLastUnlocked">
        <img
          src="/skull_p.png"
          class="skull"
          alt="Level Image"
        />
      </div>
      <p>Level {{ levelNumber }}</p>
    </router-link>
    <div v-else>
      <img
        :src="levelImagePath"
        alt="Level Image"
      />
      <p>Level {{ levelNumber }}</p>
    </div>
    <div class="info-box">
      <div class="info-row">
        <img
          src="/ship_p.png"
          alt="Speed"
          class="info-icon"
        > {{ opponentWpm }} WPM
      </div>
      <div class="info-row">
        <img
          src="/parrot_p.png"
          alt="Rank"
          class="info-icon"
        > {{ rank }}
      </div>
      <div class="info-row">
        <img
          src="/coins_p.png"
          alt="Doubloons"
          class="info-icon"
        > {{ winnings }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { OPPONENT_WPM, RANKS, WINNINGS } from "../../components/GameConstants";

export default defineComponent({
  props: {
    levelNumber: {
      type: Number,
      required: true,
    },
    isUnlocked: {
      type: Boolean,
      required: true,
    },
    isLastUnlocked: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const levelImagePath = computed(() => {
      if (props.levelNumber >= 1 && props.levelNumber <= 15) {
        return `/avatars/Head${props.levelNumber}.png`;
      }
      return "/avatar.png"; // default image if levelNumber is out of range
    });

    const opponentWpm = computed(() => OPPONENT_WPM[props.levelNumber]);
    const rank = computed(() => RANKS[Math.floor(props.levelNumber)]);
    const winnings = computed(() => WINNINGS[props.levelNumber]);

    return {
      levelImagePath,
      opponentWpm,
      rank,
      winnings,
    };
  },
});
</script>


<style scoped>
.level-square {
  display: flex;
  flex-direction: column;
  align-items: center; /* Aligns items horizontally in the middle */
  justify-content: center; /* Aligns items vertically in the middle */
  text-align: center;
  margin: 20px;
  cursor: pointer;
  position: relative;
  border-bottom: 2px solid #2d4053; /* Cohesive look with the info box */
}

.info-box {
  width: 100%;
  background-color: #2d4053;
  border-radius: 5px;
  padding: 5px;
  color: white;
  font-size: 0.6rem; /* Smaller font size for the info */
}

.info-row {
  margin: 0px 0; /* Spacing between rows */
  display: flex;
  align-items: center; /* Keeps items vertically centered */
  justify-content: center; /* Centers items horizontally within the container */
}

.info-icon {
  height: 10px; /* Align height with font size */
  width: auto; /* Maintain aspect ratio */
  margin-right: 5px;
  display: block; /* Ensures the image is treated as a block-level element inside flex */
  object-fit: contain; /* Ensures the image is scaled correctly within the height */
}

.level-square img,
.level-square p {
  /* Centering the content */
  align-self: center;
}

.locked {
  opacity: 0.5;
  pointer-events: none; /* Disable clicking */
  cursor: default; /* Change cursor to default for locked levels */
}

.level-square img:not(.info-icon) {
  width: 100px;
  height: 100px;
}

.skull {
  padding: 17px;
}

.shortcut-key {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translate(-50%, 0);
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

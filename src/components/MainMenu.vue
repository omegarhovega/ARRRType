<!--
MainMenu
- Main Menu at the top of application which remains throughout
- Changes depending on component and on whether user logs in
-->
<template>
  <div
    class="menu-container"
    :key="mainMenuKey"
  >
    <div class="menu-wrapper fixed top-0 left-0 w-full z-50">
      <div class="w-2/3 mx-auto flex justify-between items-end py-4">
        <!-- Logo -->
        <div class="flex items-end">
          <div class="relative mr-2">
            <img
              src="/pirate_s2.webp"
              alt="Logo"
              class="h-12"
              @mouseover="showPirateTooltip = true"
              @mouseout="showPirateTooltip = false"
            />
            <div
              class="tooltip"
              v-if="showPirateTooltip"
            >Arrr!</div>
          </div>

          <!-- Flex container to align items vertically -->
          <router-link to="/">
            <h1 class="text-3xl text-white mr-4 title">ARRRType</h1>
          </router-link>

          <div
            class="shortcut-container"
            v-if="showShortcuts"
          >
            &#8618;
            <div class="shortcut-word shortcut-word-button ctrl">Ctrl</div>
            <div class="shortcut-word">+</div>
            <div class="shortcut-word shortcut-word-button enter">Enter</div>
          </div>
        </div>
        <!-- Menu items -->
        <div class="flex items-end">
          <div class="menu-buttons">
            <div class="user-buttons">
              <span v-if="showShortcuts">
                <span
                  v-if="userSession && showAccount"
                  class="menu-text"
                >
                  <router-link to="/account"><img
                      src="/skull_p.webp"
                      alt="Skull"
                      class="h-5 w-5 mr-2 inline-block"
                    />Account</router-link>
                </span>
                <span
                  v-if="!userSession"
                  class="menu-text"
                >
                  <router-link to="/login"><img
                      src="/skull_p.webp"
                      alt="Skull"
                      class="h-5 w-5 mr-2 inline-block"
                    />Login</router-link>
                </span>
                <span
                  v-if="showAccount"
                  class="menu-text-nolink"
                > | </span>
                <span
                  v-if="!showAccount"
                  @click="signOut"
                  class="menu-text"
                >Sign Out</span>
                <span
                  v-if="!userSession"
                  class="menu-text"
                >
                  <router-link to="/register">Register</router-link>
                </span>
                <span
                  v-if="!userSession || !showAccount"
                  class="menu-text-nolink"
                > | </span>
              </span>
              <span
                class="menu-text-coins"
                @mouseover="showCoinsTooltip = true"
                @mouseout="showCoinsTooltip = false"
              >
                <div class="relative mr-2"><img
                    src="/coins_p.webp"
                    alt="Skull"
                    class="h-5 w-5 inline-block"
                  />
                  {{ userCoins }}
                  <div
                    class="tooltip"
                    v-if="showCoinsTooltip"
                  >Doubloons!</div>
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { onMounted, onUnmounted, defineComponent, computed, ref } from "vue";
import { useStore } from "../stores/store";
import { supabase } from "../supabase";
import { useRouter, useRoute } from "vue-router";

export default defineComponent({
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const userSession = computed(() => store.userSession);
    const userCoins = computed(() => store.userCoins);
    const mainMenuKey = computed(() => store.mainMenuKey);

    //handles different menu options depending on current page
    const showShortcuts = computed(() => route.name !== "Home");
    const showAccount = computed(() => route.name !== "Account");

    const fetchUserCoins = () => {
      store.fetchUserCoins();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // For Mac
      if (event.metaKey && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        router.push({ name: "Home" });
      }
      // For Windows and Linux
      else if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        router.push({ name: "Home" });
      }
    };

    // tooltips for logo and coins
    const showPirateTooltip = ref(false);
    const showCoinsTooltip = ref(false);

    // handles user logging out and correct display of main menu
    const signOut = async () => {
      await supabase.auth.signOut();
      store.logout();
      router.push("/login").then(() => {
        // Refresh the page after navigating to the login page to reset variables to values in local storage again
        location.reload();
      });
      console.log("signOut function completed");
    };

    onMounted(() => {
      window.addEventListener("keydown", handleKeyDown);
    });

    onUnmounted(() => {
      window.removeEventListener("keydown", handleKeyDown);
    });

    return {
      showPirateTooltip,
      showCoinsTooltip,
      userSession,
      userCoins,
      mainMenuKey,
      fetchUserCoins,
      signOut,
      showShortcuts,
      showAccount,
    };
  },

  // if user logs in or out, fetch coins again to display correct value
  watch: {
    userSession: {
      handler(newValue, oldValue) {
        if (newValue && newValue.user) {
          this.fetchUserCoins();
        }
      },
      deep: true,
    },
  },
});
</script>

<style scoped>
.menu-container {
  position: relative;
  z-index: 10002;
}
.menu-wrapper {
  z-index: 10001;
  min-width: 900px;
  background-color: #2c3a4d;
}

.title {
  font-family: "Piedra", cursive;
  color: #d5ddd7;
}

.tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  padding: 10px;
  color: #d5ddd7;
  background-color: #2d4053;
  border-radius: 5px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: normal;
}
.tooltip::before {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent #2d4053 transparent;
}

.menu-buttons {
  display: flex;
  align-items: center;
}

.user-buttons {
  display: flex;
  gap: 10px;
}

.menu-text-nolink {
  font-size: 16px;
  font-weight: bold;
}

.menu-text {
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.menu-text:hover {
  text-decoration: underline;
}

.menu-text-coins {
  font-size: 16px;
  font-weight: bold;
}

.shortcut-container {
  display: flex;
  align-items: center;
}

.shortcut-word {
  margin-left: 5px;
  color: white;
  font-size: 12px;
}
.shortcut-word-button {
  width: 50px;
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

.ctrl {
  width: 35px;
}
.enter {
  width: 45px;
}
</style>



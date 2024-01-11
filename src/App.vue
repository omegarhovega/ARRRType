<template>
  <div class="w-2/3 mx-auto"> <!-- This sets the width to 2/3 and centers it -->
    <Menu :key="mainMenuKey" />
    <div class="content-container">
      <template v-if="currentRoute.path === '/TrainMain'">
        <TrainSubMenu />
      </template>
      <template v-if="currentRoute.path === '/CampaignMain'">
      </template>
      <!-- Content container with padding-top to push it below the menu -->
      <router-view :key="$route.fullPath"></router-view>
      <Footer />
    </div>
  </div>
</template>


<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { supabase } from "./supabase";
import { useStore } from "./stores/store"; // Import the store from your store.js file
import { useRoute } from "vue-router";
import Menu from "./components/MainMenu.vue";
import Footer from "./components/Footer.vue";
import TrainSubMenu from "./views/Train/TrainSubMenu.vue";

export default defineComponent({
  name: "App",
  components: {
    Menu,
    Footer,
    TrainSubMenu,
  },
  setup() {
    const store = useStore();
    const currentRoute = useRoute();

    // Replace "store.commit" with direct function calls
    onMounted(() => {
      supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event);
        console.log("Current session:", session);
        store.setUserSession(session);
      });
    });

    // Remove mapState and directly access properties from the store
    return {
      currentRoute,
      mainMenuKey: store.mainMenuKey,
    };
  },
});
</script>

<style>
.content-container {
  /* Reference to match the height of your menu */
  padding-top: var(--menu-height);
}
</style>

<template>
  <div class="w-2/3 mx-auto">
    <Menu :key="mainMenuKey" />
    <div class="content-container">
      <template v-if="currentRoute.path === '/TrainMain'">
        <TrainSubMenu />
      </template>
      <template v-if="currentRoute.path === '/CampaignMain'">
      </template>
      <!-- Content container with padding-top to push it below the menu -->
      <router-view :key="$route.fullPath"></router-view>
    </div>
    <Footer />
  </div>
</template>


<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { supabase } from "./supabase";
import { useStore } from "./stores/store";
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

    onMounted(() => {
      supabase.auth.onAuthStateChange((event, session) => {
        store.setUserSession(session);
      });
    });

    return {
      currentRoute,
      mainMenuKey: store.mainMenuKey,
    };
  },
});
</script>

<style>
.content-container {
  /* Padding matches height of menu */
  padding-top: var(--menu-height);
}
</style>

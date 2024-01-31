<template>
  <div class="w-2/3 mx-auto">
    <Menu
      :key="mainMenuKey"
      @toggle-settings-menu="toggleSettingsMenu"
    />
    <div class="content-container">
      <!-- SettingsMenu Overlay -->
      <SettingsMenu
        :isOpen="isSettingsMenuOpen"
        @close-settings="isSettingsMenuOpen = false"
      />
      <!-- Content container with padding-top to push it below the menu -->
      <router-view :key="$route.fullPath"></router-view>
    </div>
    <Footer />
  </div>
</template>


<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { supabase } from "./supabase";
import { useStore } from "./stores/store";
import { useRoute } from "vue-router";
import Menu from "./components/MainMenu.vue";
import Footer from "./components/Footer.vue";
import SettingsMenu from "./components/SettingsMenu.vue";

export default defineComponent({
  name: "App",
  components: {
    Menu,
    Footer,
    SettingsMenu,
  },
  setup() {
    const store = useStore();
    const currentRoute = useRoute();
    const isSettingsMenuOpen = ref(false);

    const toggleSettingsMenu = () => {
      isSettingsMenuOpen.value = !isSettingsMenuOpen.value;
    };

    onMounted(() => {
      supabase.auth.onAuthStateChange((event, session) => {
        store.setUserSession(session);
      });
    });

    return {
      currentRoute,
      mainMenuKey: store.mainMenuKey,
      isSettingsMenuOpen,
      toggleSettingsMenu,
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

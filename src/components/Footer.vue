<template>
  <footer class="footer-container">
    <div class="footer-content">
      <router-link
        to="/disclaimer"
        class="footer-link"
      >Disclaimer</router-link>
      <span class="divider">|</span>
      <router-link
        to="/privacy"
        class="footer-link"
      >Privacy</router-link>
      <span class="divider">|</span>
      <router-link
        to="/contact"
        class="footer-link"
      >Contact</router-link>
      <span class="divider">|</span>
      <a
        href="https://github.com/omegarhovega/ARRRType"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >
        <img
          src="/github.webp"
          alt="Github"
          class="footer-image"
        />GitHub
      </a>
      <span class="divider">|</span>
      <router-link
        to="/news"
        class="footer-link"
      >v0.95b</router-link>
    </div>
  </footer>
</template>

<script lang="ts">
export default {
  name: "FooterComponent",
};
</script>

<style scoped>
.footer-container {
  width: 100%;
  background-color: #2c3a4d;
  color: white;
  text-align: center;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 100;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  color: #d5ddd7;
}

.footer-link,
.divider {
  color: inherit;
  margin: 0 5px;
  text-decoration: none;
  font-size: 10px;
  opacity: 0.5;
  display: inline-flex;
  align-items: center;
}

.footer-link:hover {
  text-decoration: underline;
}

.footer-image {
  height: 10px;
  width: auto;
  margin-right: 5px;
}
</style>

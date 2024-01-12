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
      >Privacy Policy</router-link>
      <span class="divider">|</span>
      <a
        class="footer-link"
        href="mailto:admin@arrrtype.com"
      >Contact Us</a>
      <span class="divider">|</span>
      <a
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >
        <img
          src="/github.png"
          alt="Github"
          class="footer-image"
        />GitHub
      </a>
      <span class="divider">| v0.9b</span>
    </div>
  </footer>
</template>

<script lang="ts">
export default {
  name: "FooterComponent",
  // Other component options
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
  display: flex; /* Changed to flex to align items in a row */
  justify-content: center; /* Center items horizontally */
  align-items: center; /* Center items vertically */
  padding: 10px;
  color: #d5ddd7;
}

.footer-link,
.divider {
  color: inherit; /* Use color from parent */
  margin: 0 5px; /* Uniform margin for all elements */
  text-decoration: none; /* No underline on links */
  font-size: 10px;
  opacity: 0.5;
  display: inline-flex; /* Inline-flex for aligning with the image */
  align-items: center; /* Center text and image vertically */
}

.footer-link:hover {
  text-decoration: underline;
}

.footer-image {
  height: 10px; /* Adjust height as necessary */
  width: auto; /* Keep image aspect ratio */
  margin-right: 5px; /* Space between image and text */
}
</style>

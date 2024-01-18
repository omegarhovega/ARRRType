<template>
  <div class="contact-form">
    Contact us using <u>admin@arrrtype.com</u>
  </div>
</template>
  
  
  <style scoped>
.contact-form {
  display: flex;
  flex-direction: column;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  padding-bottom: var(
    --footer-height
  ); /* Padding bottom equal to your footer's height */
  padding-top: var(--menu-height); /* Padding top equal to your menu's height */
  overflow-y: auto;
  gap: 10px;
}
</style>
  
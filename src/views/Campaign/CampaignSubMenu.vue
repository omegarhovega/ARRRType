<!--
CampaignSubMenu
- TBD
-->
<template>
  <div class="sub-menu-container">
    <div class="sub-menu">
      <a href="#">Levels</a>
      <a href="#">Status</a>
    </div>
  </div>
</template>


<!-- Add any necessary styling or scripting here -->
<style scoped>
.sub-menu-container {
  position: absolute;
  top: 70px; /* Align to the top of the main menu container */
  left: 0; /* Align to the left */
  width: 100%; /* Full width */
  z-index: 101; /* Lower z-index to appear below the main menu */
  /* Additional styles as needed */
}
</style>

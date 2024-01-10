<!--
Login
Using Composition API
- Lets existing users login
- Shown after logout
-->
<template>
  <div class="login">
    <div class="login-container">
      <form class="login-form">
        <input
          type="email"
          v-model="email"
          placeholder="Email"
          required
          class="input-field"
        />
        <button
          @click.prevent="handleResetPassword"
          class="reset-button"
        >Send Reset Link</button>
      </form>
    </div>
  </div>
</template>
  
  <script lang="ts">
import { defineComponent, ref } from "vue";
import { supabase } from "../supabase";

export default defineComponent({
  setup() {
    const email = ref<string>(""); // Type for the email

    const handleResetPassword = async () => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.value,
        {
          redirectTo: "http://localhost:5173/reset", // *NOTE* Update this URL
        }
      );
      if (error) {
        console.error(error);
        alert(error.message);
      } else {
        alert("Password reset email sent!");
      }
    };

    return {
      email,
      handleResetPassword,
    };
  },
});
</script>
  
  
<style scoped>
.login {
  display: flex;
  justify-content: center; /* Centers items horizontally */
  align-items: center; /* Centers items vertically */
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  flex-wrap: wrap; /* Allows items to wrap if needed */
  gap: 10px; /* You can set a gap between the items */
}
.login-container {
  display: flex;
  justify-content: center; /* Centers items horizontally in the mode-boxes-container */
  flex-wrap: wrap; /* Allows items to wrap within the mode-boxes-container */
  gap: 10px; /* You can set a gap between the items */
}
.input-field {
  color: #36454f;
}
.login-form {
  display: flex;
  flex-direction: column; /* Align items vertically */
  gap: 10px; /* Add space between items */
  width: 200px;
}

.reset-button {
  outline: 1px solid;
  background-color: #2d4053;
}
</style>
  
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
    const email = ref<string>("");

    const handleResetPassword = async () => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.value,
        {
          redirectTo: "ResetPassword",
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
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
  flex-wrap: wrap;
  gap: 10px;
}
.login-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}
.input-field {
  color: #36454f;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 200px;
}

.reset-button {
  outline: 1px solid;
  background-color: #2d4053;
}
</style>
  
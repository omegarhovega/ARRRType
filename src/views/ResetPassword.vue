<template>
  <div class="container">
    <h1>Reset Password</h1>
    <form
      @submit.prevent="handleReset"
      class="form"
    >
      <input
        type="password"
        v-model="newPassword"
        placeholder="New Password"
        required
        class="input-field"
      />
      <input
        type="password"
        v-model="confirmPassword"
        placeholder="Confirm Password"
        required
        class="input-field"
      />
      <span
        v-if="passwordValidationError"
        class="error-text"
      >{{ passwordValidationError }}</span>
      <button
        type="submit"
        :disabled="!!passwordValidationError"
        class="reset-button"
      >Reset Password</button>
    </form>
  </div>
</template>
    
  <script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { supabase } from "../supabase";

export default defineComponent({
  setup() {
    const newPassword = ref("");
    const confirmPassword = ref("");

    const passwordValidationError = computed(() => {
      if (newPassword.value.length < 6) {
        return "Password must be at least 6 characters long.";
      }
      if (newPassword.value !== confirmPassword.value) {
        return "Passwords do not match.";
      }
      return null;
    });

    const handleReset = async () => {
      if (passwordValidationError.value) {
        alert(passwordValidationError.value);
        return;
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword.value,
      });

      if (error) {
        console.error(error);
        alert(error.message);
      } else {
        alert("Password has been reset!");
        // Redirect to login or some other page
      }
    };

    return {
      newPassword,
      confirmPassword,
      passwordValidationError,
      handleReset,
    };
  },
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 200px;
}

.input-field {
  color: #36454f;
}

.reset-button {
  outline: 1px solid;
  background-color: #2d4053;
}
</style>
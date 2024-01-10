<!--
Registration
Using Composition API
- Lets existing users register
- Uses supabase to store user info
- *NOTE* Needs to be secured against bots
-->
<template>
  <div class="login">
    <div class="login-container">
      <form
        @submit.prevent="handleRegistration"
        class="login-form"
      >
        <input
          type="email"
          v-model="email"
          placeholder="Email"
          required
          class="input-field"
        />
        <input
          type="email"
          v-model="confirmEmail"
          placeholder="Confirm Email"
          required
          class="input-field"
        />
        <div
          v-if="emailMismatch"
          class="warning"
        >Emails do not match.</div>

        <input
          type="password"
          v-model="password"
          placeholder="Password"
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
        <div
          v-if="passwordMismatch"
          class="warning"
        >Passwords do not match.</div>

        <button
          type="submit"
          class="login-button"
          :disabled="!isFormValid"
        >
          Register
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import { supabase } from "../supabase";
import { useRouter } from "vue-router";

export default defineComponent({
  setup() {
    const email = ref("");
    const confirmEmail = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const router = useRouter();

    const emailMismatch = computed(() => {
      return email.value !== confirmEmail.value;
    });

    // Check for password mismatch
    const passwordMismatch = computed(() => {
      return password.value !== confirmPassword.value;
    });

    const isFormValid = computed(() => {
      return (
        email.value === confirmEmail.value &&
        password.value === confirmPassword.value
      );
    });

    const handleRegistration = async () => {
      if (isFormValid.value) {
        console.log("Form is valid:", isFormValid.value);
        console.log("Attempting registration");
        const { data, error } = await supabase.auth.signUp({
          email: email.value,
          password: password.value,
        });
        console.log("SignUp response:", { data, error });

        if (error) {
          alert(error.message);
          console.log("Registration error:", error);
        } else {
          alert(
            "Registration successful! Please check your email for confirmation."
          );
          console.log("Registration data:", data);
          router.push("/login");
        }
      } else {
        alert("The confirmed email or password do not match.");
      }
    };

    return {
      email,
      confirmEmail,
      password,
      confirmPassword,
      isFormValid,
      emailMismatch,
      passwordMismatch,
      handleRegistration,
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
.login-button {
  outline: 1px solid;
  background-color: #2d4053;
}
.warning {
  color: red;
}
</style>

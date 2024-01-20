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
          type="text"
          v-model="username"
          placeholder="Username"
          required
          class="input-field"
        />
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

    const username = ref("");

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
        const { data, error } = await supabase.auth.signUp({
          email: email.value,
          password: password.value,
          options: {
            data: {
              username: username.value,
            },
          },
        });

        if (error) {
          alert(error.message);
        } else {
          alert(
            "Registration successful! Please check your email for confirmation."
          );
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
      username,
      handleRegistration,
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
.login-button {
  outline: 1px solid;
  background-color: #2d4053;
}
.warning {
  color: red;
}
</style>

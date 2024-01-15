<!--
Login
Using Composition API
- Lets existing users login
- Shown after logout
-->
<template>
  <div class="login">
    <div class="login-container">
      <form
        @submit.prevent="handleLogin"
        class="login-form"
      >
        <input
          ref="emailInput"
          type="email"
          v-model="email"
          placeholder="Email"
          required
          class="input-field"
        />
        <input
          type="password"
          v-model="password"
          placeholder="Password"
          required
          class="input-field"
        />
        <button
          type="submit"
          class="login-button"
        >Login</button>
        <button
          type="button"
          @click="navigate('ForgotPassword')"
          class="forgot-button"
        >Forgot Password?</button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { supabase } from "../supabase";
import { useRouter } from "vue-router";
import { useStore } from "../stores/store";

export default defineComponent({
  setup() {
    const store = useStore();
    const email = ref<string>("");
    const password = ref<string>("");
    const router = useRouter();

    const emailInput = ref<HTMLInputElement | null>(null);

    const handleLogin = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (error) {
        console.error(error);
        alert(error.message);
      } else {
        store.setUserSession(data); // Set the user session in the store
        router.push("/account");
      }
    };

    function navigate(routeName: string) {
      router.push({ name: routeName });
    }

    onMounted(() => {
      setTimeout(() => {
        // timeout to prevent shortcut L leading to login page to be input into email field unintendedly
        if (emailInput.value) {
          emailInput.value.focus(); // Focus the input when component is mounted
        }
      }, 0);
    });

    return {
      email,
      password,
      handleLogin,
      navigate,
      emailInput,
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

.forgot-button {
  outline: 1px solid;
  background-color: #2d4053;
}
</style>

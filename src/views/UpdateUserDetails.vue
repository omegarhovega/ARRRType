<template>
  <div class="update-user-details">
    <h2 class="mb-5">Update User Details</h2>

    <!-- Username Update Form -->
    <div class="update-section">
      <div>Current Username:</div>
      <div class="mb-2">{{ username }}</div>
      <div class="input-group">
        <label for="username">New Username:</label>
        <input
          id="username"
          type="text"
          v-model="newUsername"
          autocomplete="off"
        />
      </div>
      <p
        v-if="usernameTakenError"
        class="mismatch-message"
      >
        Username already taken.
      </p>
      <button
        type="submit"
        class="update-button"
        @click="updateUsername"
      >Update Username</button>
    </div>

    <!-- Email Update Form -->
    <div class="update-section">
      <div class="input-group">
        <div>Current Email:</div>
        <div class="mb-2">{{ userEmail}}</div>
        <label for="new-email">New Email:</label>
        <input
          id="new-email"
          type="email"
          v-model="newEmail"
          autocomplete="off"
        />
      </div>
      <div class="input-group">
        <label for="repeat-email">Repeat New Email:</label>
        <input
          id="repeat-email"
          type="email"
          v-model="repeatEmail"
          autocomplete="off"
        />
      </div>
      <p
        v-if="emailMismatch"
        class="mismatch-message"
      >Emails do not match!</p>
      <button
        type="submit"
        class="update-button"
        @click="updateEmail"
      >Update Email</button>
    </div>

    <!-- Password Update Form -->
    <div class="update-section">
      <div class="input-group">
        <label for="new-password">New Password:</label>
        <input
          id="new-password"
          type="password"
          v-model="newPassword"
          autocomplete="off"
        />
      </div>
      <div class="input-group">
        <label for="repeat-password">Repeat New Password:</label>
        <input
          id="repeat-password"
          type="password"
          v-model="repeatPassword"
          autocomplete="off"
        />
      </div>
      <p
        v-if="passwordMismatch"
        class="mismatch-message"
      >Passwords do not match!</p>
      <button
        type="submit"
        class="update-button"
        @click="updatePassword"
      >Update Password</button>
    </div>
  </div>
</template>



<script lang="ts">
import { ref, computed, onMounted } from "vue";
import { supabase } from "../supabase";
import { useStore } from "../stores/store";

export default {
  setup() {
    const store = useStore(); // Use the Pinia store
    const newEmail = ref("");
    const repeatEmail = ref("");
    const newPassword = ref("");
    const repeatPassword = ref("");
    const newUsername = ref("");
    const session = computed(() => store.userSession);
    const userEmail = computed(() => session.value?.user?.email);
    const username = ref<string>("");

    const usernameTakenError = ref(false);

    // Computed properties for mismatch
    const emailMismatch = computed(() => newEmail.value !== repeatEmail.value);
    const passwordMismatch = computed(
      () => newPassword.value !== repeatPassword.value
    );

    async function getProfile() {
      // pulls user info from supabase table
      try {
        // Guard clause to check if session and user are defined
        if (!session.value || !session.value.user) {
          console.warn("Session or user is not defined");
          return;
        }
        const { user } = session.value;

        let { data, error, status } = await supabase
          .from("profiles")
          .select(`username`)
          .eq("id", user.id)
          .single();

        if (error && status !== 406) throw error;

        if (data) {
          username.value = data.username;
        }
      } catch (error) {
        alert((error as Error).message);
      }
    }

    async function isUsernameTaken(newUsername: any) {
      // Check if the username already exists in the database
      const { data, error } = await supabase
        .from("profile_names")
        .select("username")
        .ilike("username", `%${newUsername.trim()}%`); // Correct use of ilike

      return data && data.length > 0;
    }

    async function updateUsername() {
      try {
        // Reset the error state at the beginning of the method
        usernameTakenError.value = false;

        const user =
          session.value && session.value.user ? session.value.user.id : null;

        if (!user) {
          throw new Error("User is not logged in");
        }

        // Check if the username is already taken and it's not the user's current username
        if (
          (await isUsernameTaken(newUsername.value)) &&
          newUsername.value.toLowerCase() !== username.value.toLowerCase()
        ) {
          usernameTakenError.value = true;
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .update({ username: newUsername.value })
          .eq("id", user);

        if (error) throw error;

        // Update the displayed username immediately after successful update
        username.value = newUsername.value;

        // Handle successful username update
        alert("Username updated successfully");
      } catch (error: any) {
        alert(error.message);
      }
    }

    async function updateEmail() {
      if (newEmail.value !== repeatEmail.value) {
        alert("Emails do not match!");
        return;
      }
      try {
        const { data, error } = await supabase.auth.updateUser({
          email: newEmail.value,
        });
        if (error) throw error;
        alert("Email updated successfully");
      } catch (error: any) {
        alert(error.message);
      }
    }

    async function updatePassword() {
      if (newPassword.value !== repeatPassword.value) {
        alert("Passwords do not match!");
        return;
      }
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword.value,
        });
        if (error) throw error;
        alert("Password updated successfully");
      } catch (error: any) {
        alert(error.message);
      }
    }

    onMounted(async () => {
      getProfile();
      await store.fetchLastUnlockedLevel(); //needed to load the player rank correctly
    });

    return {
      newEmail,
      userEmail,
      repeatEmail,
      newPassword,
      repeatPassword,
      newUsername,
      emailMismatch,
      passwordMismatch,
      username,
      updateEmail,
      updatePassword,
      updateUsername,
      usernameTakenError,
    };
  },
};
</script>


<style scoped>
.update-user-details {
  width: 100%;
  max-width: 300px;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10vh;
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

.update-section {
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.input-group input {
  width: 100%;
  padding: 3px;
}

.update-button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: black;
}

.mismatch-message {
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
}
</style>




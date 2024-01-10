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
        />
      </div>
      <button
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
        />
      </div>
      <div class="input-group">
        <label for="repeat-email">Repeat New Email:</label>
        <input
          id="repeat-email"
          type="email"
          v-model="repeatEmail"
        />
      </div>
      <p
        v-if="emailMismatch"
        class="mismatch-message"
      >Emails do not match!</p>
      <button
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
        />
      </div>
      <div class="input-group">
        <label for="repeat-password">Repeat New Password:</label>
        <input
          id="repeat-password"
          type="password"
          v-model="repeatPassword"
        />
      </div>
      <p
        v-if="passwordMismatch"
        class="mismatch-message"
      >Passwords do not match!</p>
      <button
        class="update-button"
        @click="updatePassword"
      >Update Password</button>
    </div>
  </div>
</template>



<script lang="ts">
import { ref, computed, onMounted } from "vue";
import { supabase } from "../supabase"; // Adjust the path as needed
import { useStore } from "../stores/store"; // Import the main Pinia store

export default {
  setup() {
    const store = useStore(); // Use the Pinia store
    const newEmail = ref("");
    const repeatEmail = ref("");
    const newPassword = ref("");
    const repeatPassword = ref("");
    const newUsername = ref("");
    const session = computed(() => store.userSession); // Access userSession from the Pinia store
    const userEmail = computed(() => session.value?.user?.email);
    const username = ref<string>("");

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

    async function updateUsername() {
      try {
        const user =
          session.value && session.value.user ? session.value.user.id : null;

        if (!user) {
          throw new Error("User is not logged in");
        }

        const { data, error } = await supabase
          .from("profiles")
          .update({ username: newUsername.value })
          .eq("id", user);

        if (error) throw error;

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
      await store.fetchLastUnlockedLevel(); //needed to load the player rank correctly *NOTE* can we put this in store so that it does not need to be redone every time
      //*NOTE* load userStats and averagelast100
      console.log("fetching last unlocked level:", store.lastUnlockedLevel);
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
    };
  },
};
</script>


<style scoped>
.update-user-details {
  width: 100%;
  max-width: 300px; /* Set a maximum width */
  margin: auto; /* Center the form */
  display: flex;
  flex-direction: column;
  align-items: center; /* Align children (sections) in the center */
  padding-top: 10vh;
}

.update-section {
  width: 100%; /* Ensure the section takes the full width of the container */
  margin-bottom: 20px; /* Space between sections */
  display: flex;
  flex-direction: column;
  align-items: center; /* Align items in the section to the center */
}

.input-group {
  width: 100%; /* Ensure the input group takes the full width of the section */
  display: flex;
  flex-direction: column;
  align-items: center; /* Align input fields in the center */
  margin-bottom: 10px; /* Space between input fields */
}

.input-group input {
  width: 100%; /* Make input fields take full width of the input group */
  padding: 3px; /* Reduced padding for less height */
  /* If you need to set a specific height, uncomment the next line */
  /* height: 30px; */
}

.update-button {
  width: 100%; /* Set button width to match input fields */
  padding: 10px;
  margin-top: 10px;
  /* Additional styling for buttons */
}

.mismatch-message {
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
}
</style>




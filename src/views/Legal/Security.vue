<template>
  <div class="disclaimer">
    <h1>Contact Us</h1>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Your Email:</label>
        <input
          type="email"
          id="email"
          v-model="form.email"
          required
        >
      </div>
      <div class="form-group">
        <label for="message">Your Message:</label>
        <textarea
          id="message"
          v-model="form.message"
          required
        ></textarea>
      </div>
      <button type="submit">Send</button>
    </form>
  </div>
</template>


<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "ContactUs",
  setup() {
    const form = ref({
      email: "",
      message: "",
    });

    const handleSubmit = async () => {
      // Here you would send the form data to your backend or serverless function
      await sendEmail(form.value);
    };

    const sendEmail = async (formData: { email: string; message: string }) => {
      // Send the form data to your backend or email service.
      // This could be a POST request to a serverless function or an API endpoint.
      console.log("Sending email", formData);
      // Implement the actual email sending logic here
      // This is typically a POST request to your backend
    };

    return {
      form,
      handleSubmit,
    };
  },
});
</script>



<style scoped>
.disclaimer {
  flex-direction: column; /* This will stack children vertically */
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  padding-bottom: var(
    --footer-height
  ); /* Add padding bottom equal to your footer's height */
  overflow-y: auto;
}

h1,
p {
  width: 100%; /* Ensures they take full width of the container, pushing them each to a new line */
}
</style>
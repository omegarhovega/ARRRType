import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { supabase } from '@/supabase';
import type { Session } from '@supabase/supabase-js'; // Type-only import
import { createPinia } from 'pinia';
import { useStore } from "./stores/store";
import router from './router';
import { setupCalendar, Calendar, DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import { Amplify } from 'aws-amplify';
import amplifyconfig from './amplifyconfiguration.json';
Amplify.configure(amplifyconfig);

const app = createApp(App);

const pinia = createPinia();
const store = useStore(pinia);

function updateSession(session: Session | null) {
    if (session) {
        store.userSession = session;
    } else {
        store.userSession = null;
    }
}

async function init() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error retrieving session:", error);
    } else if (data && data.session) { // Check if data exists and has a session property
        updateSession(data.session); // Pass the session property to updateSession
    } else {
        updateSession(null); // Set to null if no session
    }
}

init();

supabase.auth.onAuthStateChange((_, session) => {
    updateSession(session); // No need to extract a session property
});

app.config.errorHandler = (err: unknown, vm, info) => {
    if (err instanceof Error) {
        console.error(`Error: ${err.toString()}\nInfo: ${info}`);
    } else {
        console.error(`An unknown error occurred.\nInfo: ${info}`);
    }
};

app.use(setupCalendar, {});
app.component('VCalendar', Calendar);
app.component('VDatePicker', DatePicker);

app.use(pinia);
app.use(router);
app.mount('#app');

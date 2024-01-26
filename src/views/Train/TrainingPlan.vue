<template>
  <div class="container">
    <div class="username-and-rank">
      <div class="mt-5">
        <p class="font-bold underline">Create your own personalized training plan:</p>
      </div>
      <div class="mt-3">
        Based on your current rank of <span class="font-bold underline">{{ currentRank }}</span>, your current average speed seems to be around <span class="font-bold underline">{{ currentWpm }} WPM</span>.
        You are at an <span class="font-bold underline">{{ userLevel }}</span>. If this does not represent your current skill level, please complete the Campaign levels to increase your rank.
      </div>
      <div class="mt-5">
        <p class="font-bold underline">Input details:</p>
      </div>
      <!-- Input for Starting Date -->
      <div class="mt-3">
        Choose your starting date for the training plan:
        <input
          type="date"
          v-model="userPreferences.startDate"
        >
      </div>
      <!-- Weekday Selection for Training -->
      <div class="section">
        Select your training days in a week (4-6 recommended):
        <div class="checkbox-container">
          <div
            v-for="day in weekDays"
            :key="day"
            class="checkbox-item"
          >
            <input
              type="checkbox"
              class="checkbox"
              :id="day"
              :value="day"
              v-model="userPreferences.trainingDays"
            >
            <label :for="day">{{ day }}</label>
          </div>
        </div>
      </div>

      <!-- Input for Training Time -->
      <div class="section">
        When during the day can you start training?
        <input
          type="time"
          v-model="userPreferences.timeOfDay"
        >
      </div>

      <!-- Input for Session Duration -->
      <div class="section">
        What is your preferred session length? (15 mins - 45 mins recommended)
        <input
          type="number"
          v-model="userPreferences.duration"
          min="15"
          max="45"
        >
      </div>

      <!-- Input for Training Plan Length -->
      <div class="section">
        Set Training Plan length in weeks (minimum 4 weeks, maximum 52 weeks).
        <input
          type="number"
          v-model="userPreferences.lengthInWeeks"
          min="4"
          max="52"
        >
      </div>

      <!-- Button to Generate Training Plan -->
      <div class="mt-5">
        <button @click="generateTrainingPlan"><img
            src="/parrot_p.webp"
            alt="Parrot"
            class="h-5 w-5 mr-2 inline-block"
          />Create Training Plan</button>

      </div>

      <!-- Calendar Placeholder -->
      <div class="mt-5">
        <v-calendar :attributes="calendarAttributes"></v-calendar>
      </div>
      <div
        class="section"
        v-if="showDownload"
      >
        <div class="mt-5 mb-1">Create a series in your calendar for your training sessions:</div>
        <button
          v-if="icsDataUrl"
          @click="downloadICSFile"
          class="download-button"
        >
          Download Training Plan (.ics)
        </button>

      </div>
    </div>
  </div>
</template>
  
<script lang="ts">
import { defineComponent, onMounted, ref, computed, reactive } from "vue";
import { useStore } from "../../stores/store"; // Import the main Pinia store
import { supabase } from "../../supabase";

interface CalendarEvent {
  start: Date;
  end: Date;
  title: string;
  content: string;
}

export default defineComponent({
  methods: {
    downloadICSFile() {
      const link = document.createElement("a");
      link.href = this.icsDataUrl;
      link.download = "ArrrType_plan.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  },
  setup() {
    const store = useStore(); // Use the Pinia store
    const session = computed(() => store.userSession);
    const currentRank = computed(() => store.getCurrentRank());
    const currentWpm = computed(() => store.getCurrentWpm());
    const { user } = session.value;

    const calendarEvents = reactive<CalendarEvent[]>([]);

    const calendarAttributes = computed(() => {
      return calendarEvents.map((event) => ({
        dates: event.start,
        dot: {
          backgroundColor: "blue",
        },
        popover: {
          label: event.title,
        },
      }));
    });

    // Computed property to determine user level based on WPM
    const userLevel = computed(() => {
      if (currentWpm.value < 50) return "beginner level (<50 WPM)";
      if (currentWpm.value < 90) return "intermediate level (50-90 WPM)";
      if (currentWpm.value < 120) return "experienced level (50-120 WPM)";
      return "advanced level (>120 WPM)";
    });

    const userPreferences = ref({
      rank: "",
      trainingDays: [] as string[],
      timeOfDay: "",
      duration: "",
      lengthInWeeks: "",
      startDate: new Date().toISOString().split("T")[0],
    });

    const weekDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    // Computed property for session description based on user level
    const sessionDescription = computed(() => {
      switch (userLevel.value) {
        case "beginner level (<50 WPM)":
          return `Random Words, 
                  Single Words, 
                  Texts, 
                  https://www.arrrtype.com`;
        case "intermediate level (50-90 WPM)":
          return `Text, 
              Single Words, 
              https://www.arrrtype.com`;
        case "experienced level (50-120 WPM)":
          return `Text, 
              Single Words, 
              https://www.arrrtype.com`;
        case "advanced level (>120 WPM)":
          return `Text, 
              https://www.arrrtype.com`;
        default:
          return "Training Session";
      }
    });

    // Reactive variable to hold the .ics data URL
    const icsDataUrl = ref("");
    const showDownload = ref(false);

    // generate training plan and create .ics for download
    const generateTrainingPlan = async () => {
      // check whether all fields are filled out
      if (!validateTrainingPlanInput()) {
        showDownload.value = false;
        return;
      }

      let icsContent =
        "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Your Company//Your Product//EN\n";

      const sessionDuration = Number(userPreferences.value.duration);
      const startDate = new Date(userPreferences.value.startDate);
      const trainingLengthInDays =
        Number(userPreferences.value.lengthInWeeks) * 7;

      // Clear existing events
      calendarEvents.splice(0, calendarEvents.length);

      // Get the RRULE string for selected training days
      const rruleDays = userPreferences.value.trainingDays
        .map((dayName) => convertDayToICSDay(dayName))
        .join(",");

      // Find the first training day that matches the selected weekdays
      let seriesStartDate = new Date(startDate);
      while (
        !userPreferences.value.trainingDays.some((dayName) =>
          isTrainingDay(seriesStartDate, dayName)
        )
      ) {
        seriesStartDate.setDate(seriesStartDate.getDate() + 1);
      }

      // Define the start and end time for the series based on the first valid training day
      const seriesStartTime = new Date(
        seriesStartDate.getFullYear(),
        seriesStartDate.getMonth(),
        seriesStartDate.getDate(),
        parseInt(userPreferences.value.timeOfDay.split(":")[0]),
        parseInt(userPreferences.value.timeOfDay.split(":")[1])
      );
      const seriesEndTime = new Date(
        seriesStartTime.getTime() + sessionDuration * 60000
      );

      // Add the single VEVENT with the combined RRULE
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `DTSTART:${formatDateToICS(seriesStartTime)}\n`;
      icsContent += `DTEND:${formatDateToICS(seriesEndTime)}\n`;
      icsContent += `RRULE:FREQ=WEEKLY;BYDAY=${rruleDays};UNTIL=${calculateSeriesEndDate(
        startDate,
        Number(userPreferences.value.lengthInWeeks)
      )}\n`;
      icsContent += "SUMMARY:Training Session\n";
      icsContent += `DESCRIPTION:${sessionDescription.value}\n`;
      icsContent += "END:VEVENT\n";

      // Generate individual calendar events for display
      for (let day = 0; day < trainingLengthInDays; day++) {
        const trainingDate = new Date(startDate);
        trainingDate.setDate(startDate.getDate() + day);

        if (
          userPreferences.value.trainingDays.some((dayName) =>
            isTrainingDay(trainingDate, dayName)
          )
        ) {
          const eventStartTime = new Date(
            trainingDate.getFullYear(),
            trainingDate.getMonth(),
            trainingDate.getDate(),
            parseInt(userPreferences.value.timeOfDay.split(":")[0]),
            parseInt(userPreferences.value.timeOfDay.split(":")[1])
          );
          const eventEndTime = new Date(
            eventStartTime.getTime() + sessionDuration * 60000
          );

          calendarEvents.push({
            start: eventStartTime,
            end: eventEndTime,
            title: "ArrrType Training Session",
            content: sessionDescription.value,
          });
        }
      }

      icsContent += "END:VCALENDAR";
      icsDataUrl.value = encodeURI(
        `data:text/calendar;charset=utf8,${icsContent}`
      );

      // Save training plan details to Supabase
      const trainingPlanData = {
        calendarEvents,
        icsDataUrl: icsDataUrl.value,
        userPreferences: userPreferences.value,
      };

      const { data, error } = await supabase
        .from("profiles")
        .update({ training_plan: trainingPlanData })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating training plan:", error);
      }

      showDownload.value = true;
    };

    function isTrainingDay(date: Date, dayName: string): boolean {
      const dayMap: { [key: string]: number } = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      return date.getDay() === dayMap[dayName];
    }

    function formatDateToICS(date: Date): string {
      // Format the date and time in YYYYMMDDTHHmmss format
      return (
        date
          .toISOString()
          .replace(/-|:|\.\d\d\d/g, "")
          .slice(0, -1) + "Z"
      );
    }

    function convertDayToICSDay(day: string): string {
      const dayMap: { [key: string]: string } = {
        Monday: "MO",
        Tuesday: "TU",
        Wednesday: "WE",
        Thursday: "TH",
        Friday: "FR",
        Saturday: "SA",
        Sunday: "SU",
      };

      return dayMap[day] || ""; // Fallback to an empty string if day is not found
    }

    function calculateSeriesEndDate(
      startDate: Date,
      lengthInWeeks: number
    ): string {
      const endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + lengthInWeeks * 7);
      return formatDateToICS(endDate);
    }

    const validateTrainingPlanInput = () => {
      const prefs = userPreferences.value;
      if (
        !prefs.startDate ||
        prefs.trainingDays.length === 0 ||
        !prefs.timeOfDay ||
        !prefs.duration ||
        !prefs.lengthInWeeks
      ) {
        alert(
          "Please fill out all options before generating the training plan."
        );
        return false;
      }
      return true;
    };

    // FUNCTIONS
    onMounted(async () => {
      await store.fetchLastUnlockedLevel(); //needed to load the player rank correctly

      // Fetch training plan from Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("training_plan")
        .eq("id", user.id)
        .single(); // only one profile per userid

      if (error) {
        console.error("Error fetching training plan:", error);
      } else if (data && data.training_plan) {
        const planDetails = data.training_plan;
        calendarEvents.splice(
          0,
          calendarEvents.length,
          ...planDetails.calendarEvents
        );
        icsDataUrl.value = planDetails.icsDataUrl;
        Object.assign(userPreferences.value, planDetails.userPreferences);
      }
    });

    return {
      session,
      currentRank,
      currentWpm,
      userPreferences,
      weekDays,
      generateTrainingPlan,
      userLevel,
      sessionDescription,
      icsDataUrl,
      calendarEvents,
      calendarAttributes,
      showDownload,
    };
  },
});
</script>

  
  <style scoped>
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  min-height: calc(
    100vh - var(--menu-height)
  ); /* Full height minus the menu height */
  padding-bottom: var(--footer-height); /* padding bottom footer's height */
}

.checkbox-container {
  display: flex;
  flex-wrap: wrap;
}

.checkbox-item {
  margin-right: 10px;
}

.checkbox {
  margin-right: 5px;
}

.section {
  margin-top: 10px;
}

.download-button {
  cursor: pointer;
}
</style>
  
  
  
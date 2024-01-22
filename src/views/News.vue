<template>
  <div class="news-page">
    <div class="contact-box">
      Found any bugs or do you have suggestions? Contact us at <a href="mailto:admin@arrrtype.com"><span class="text-yellow-500">admin@arrrtype.com</span></a>
    </div>
    <h1>Latest News</h1>
    <ul class="news-list">
      <li
        v-for="(newsItem, index) in newsItems"
        :key="index"
        class="news-item"
      >
        <span class="date">({{ newsItem.date }})</span>
        <span class="headline text-yellow-500">{{ newsItem.headline }}</span>
        <ul
          v-if="newsItem.body"
          class="custom-bullet"
        >
          <li
            v-for="(line, index) in splitBody(newsItem.body)"
            :key="`body-${index}`"
          >
            {{ line }}
          </li>
        </ul>
        <ul
          v-if="newsItem.bulletPoints"
          class="bullet-points"
        >
          <li
            v-for="(point, index) in newsItem.bulletPoints"
            :key="`point-${index}`"
          >
            {{ point }}
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
  
<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "NewsPage",
  setup() {
    const newsItems = ref([
      {
        headline: "Pre-release v0.95b",
        date: "22. Jan 24",
        body: "Minor updates including:",
        bulletPoints: [
          "Fixed training plan error where creating an empty plan led to a crash.",
          "Fixed name display error in PvP campaign lobby.",
          "Included username field in registration component.",
          "Fixed bug related to updating total time played and games to include all game modes available on website.",
          "Various fixes of unnecessary warning and console messages.",
          "Smaller design updates.",
        ],
      },
      {
        headline: "Initial public pre-release v0.9b",
        date: "14. Jan 24",
        body: "Initial release of ARRRType and GitHub repository.",
        bulletPoints: null,
      },
    ]);

    const splitBody = (bodyText: string) => {
      return bodyText.split("\n"); // Split by newline character
    };

    return {
      newsItems,
      splitBody,
    };
  },
});
</script>
  
 
<style scoped>
.news-page {
  padding: 20px;
}

.news-page h1 {
  margin-top: 30px;
  font-size: 1.5rem; /* Decrease the font size */
  margin-bottom: 30px;
}

.news-list {
  list-style-type: disc; /* Restore disc style for headlines */
  padding-left: 20px;
}

.news-item {
  margin-bottom: 20px;
}

.headline {
  margin-left: 10px;
  font-weight: bold;
}

.date {
  margin-left: 10px;
  font-style: italic;
}

.custom-bullet {
  list-style-type: none; /* Remove default list-style */
  padding-left: 20px; /* Indentation for custom bullets */
}

.custom-bullet li {
  margin-bottom: 5px;
  position: relative;
  padding-left: 20px; /* Additional padding for spacing between * and text */
}

.custom-bullet li::before {
  content: "* "; /* Custom bullet with space */
  position: absolute;
  left: 0; /* Position the bullet to the left of the text */
}

.bullet-points {
  list-style-type: disc; /* Standard round bullet style */
  padding-left: 55px; /* Indentation for bullet points */
}

.bullet-points li {
  margin-bottom: 5px;
}

.contact-box {
  background-color: #3c4c60; /* A blue-gray color */
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 2px;
  padding-bottom: 2px;
  border-radius: 10px;
  margin-top: 10px;
  margin-bottom: 20px;
  font-size: 13px;
  text-align: center;
}
</style>

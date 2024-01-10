<template>
  <div class="disclaimer">
    <div class="mt-10">
      <h1>Disclaimer</h1>
    </div>
    <p>Last updated December 29, 2023</p>
    <div class="mt-10 underline">Website Disclaimer</div>
    <p class="mt-5">The information provided by ARRRType (‘we’, ‘us’, or ‘our') on ARRRType.com (the 'Site’) is for general informational purposes only. All information on the Site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site. UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SITE OR RELIANCE ON ANY INFORMATION PROVIDED ON THE SITE. YOUR USE OF THE SITE AND YOUR RELIANCE ON ANY INFORMATION ON THE SITE IS SOLELY AT YOUR OWN RISK.</p>
    <div class="mt-10 underline">External Links Disclaimer</div>
    <p class="mt-5">The Site may contain (or you may be sent through the Site) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR THE ACCURACY OR RELIABILITY OF ANY INFORMATION OFFERED BY THIRD-PARTY WEBSITES LINKED THROUGH THE SITE OR ANY WEBSITE OR FEATURE LINKED IN ANY BANNER OR OTHER ADVERTISING. WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.</p>

  </div>
</template>

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
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { LEVELS } from "../components/GameConstants";
import { useStore } from "../stores/store";
import TrainMain from '../views/Train/TrainMain.vue';
import TrainSingle from '../views/Train/SingleWordTraining.vue';
import KeySelector from '../views/Train/KeySelector.vue';
import TextSelector from '../views/Train/TextSelector.vue';
import TrainingModeSelector from '../views/Train/TrainingModeSelector.vue';
import TrainingPlan from '../views/Train/TrainingPlan.vue'
import Campaign from '../views/Campaign/CampaignOverview.vue';
import CampaignGame from '../views/Campaign/CampaignGame.vue';
import UserStatsMain from '../views/Stats/UserStatsMain.vue';
import Login from '../views/Login.vue';
import NotFound from '../views/NotFound.vue';
import Registration from '../views/Registration.vue';
import Account from '../views/Account.vue';
import Start from '../views/Start.vue';
import ResetPassword from '../views/ResetPassword.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import CampaignModeSelector from '../views/Campaign/CampaignModeSelector.vue';
import OnlineLobby from '../views/OnlinePvP/OnlineLobby.vue';
import OnlineGame from '../views/OnlinePvP/OnlineGame.vue';
import UpdateUserDetails from '../views/UpdateUserDetails.vue';
import Disclaimer from '../views/Legal/Disclaimer.vue';
import Privacy from '../views/Legal/PrivacyPolicy.vue';

// Training modes
const validModes = ['random', 'words', 'text', 'single', 'keys', 'custom'];

const routes = [
  { path: '/', name: 'Home', component: Start },
  { path: '/train', name: 'Train', component: TrainingModeSelector },
  { path: '/train/single', name: 'TrainSingle', component: TrainSingle },
  {
    path: '/train/:mode',
    name: 'TrainMode',
    component: TrainMain,
    beforeEnter: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      if (validModes.includes(to.params.mode as string)) {
        next();
      } else {
        next('/not-found');
      }
    }
  },
  { path: '/train/keys', name: 'KeySelector', component: KeySelector },
  { path: '/train/custom', name: 'TextSelector', component: TextSelector },
  { path: '/train/plan', name: 'TrainingPlan', component: TrainingPlan },
  { path: '/campaign', name: 'Campaign', component: Campaign },
  {
    path: '/campaign/level/:levelNumber',
    name: 'Level',
    component: CampaignGame,
    beforeEnter: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      // check if valid train mode and level number 
      const levelNumber = parseInt(to.params.levelNumber as string);
      if (levelNumber >= 1 && levelNumber <= LEVELS) {
        next();
      } else {
        next('/not-found');
      }
    }
  },
  { path: '/stats', name: 'Stats', component: UserStatsMain },
  { path: '/stats/lastround', name: 'LastRoundStats', component: UserStatsMain, props: { initialView: 'LastRoundStats' } },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Registration },
  { path: '/account', name: 'Account', component: Account },
  { path: '/reset', name: 'ResetPassword', component: ResetPassword },
  { path: '/password', name: 'ForgotPassword', component: ForgotPassword },
  { path: '/campaignmode', name: 'CampaignMode', component: CampaignModeSelector },
  { path: '/onlinelobby', name: 'OnlineLobby', component: OnlineLobby },
  {
    path: '/onlinegame/',
    name: 'OnlineGame',
    component: OnlineGame,
  },
  {
    path: '/update-user-details',
    name: 'UpdateUserDetails',
    component: UpdateUserDetails
  },
  { path: '/disclaimer', name: 'Disclaimer', component: Disclaimer },
  { path: '/privacy', name: 'Privacy', component: Privacy },
  { path: '/:catchAll(.*)', name: 'NotFound', component: NotFound }, // catchall 404
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const store = useStore();

  // different treatment of single word train mode
  if (to.name === 'TrainMode' && to.params.mode !== 'single') {
    const routeMode = to.params.mode as string;
    const storeMode = store.selectedMode;

    if (routeMode !== storeMode) {
      store.setModeFromRouter(routeMode);
    }
    next();
  }
  else {
    next();
  }
});

export default router;


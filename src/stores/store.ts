import { defineStore } from 'pinia';
import { supabase } from '@/supabase';
import { RANKS, OPPONENT_WPM } from "../components/GameLogic/GameConstants";

export type UserStat = {
  id: number,
  timestamp: Date,
  wpm: number,
  grossWPM: number,
  accuracy: number,
  wpmPerSecond: number[],
  grossWpmPerSecond: number[],
  errors: Array<{ attempted: string, expected: string, word: string }>,
  totalOccurrences: { [key: string]: number },
  mistakesMade: { [key: string]: number },
  consistency: number
};

interface State {
  currentIndex: number;
  progressEnabled: boolean;
  opponentWPM: number;
  opponentEnabled: boolean;
  userSession: any;
  lastUnlockedLevel: number;
  mainMenuKey: number;
  userCoins: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  wordsPerSecond: string[][];
  userStats: UserStat[];
  isGameStarted: boolean,
  isGameFinished: boolean,
  startTime: Date | null,
  currentWordStartTime: Date | null,
  endTime: Date | null,
  loading: boolean,
  startTyping: boolean,
  typed: { [key: number]: string },
  typedIndices: number[],
  isCapsLockOn: boolean,
  errors: Array<{ attempted: string, expected: string, word: string }>,
  typingAllowed: boolean,
  selectedMode: "text" | "words" | "random" | "single" | "keys" | "custom";
  selectedWordLength: "3" | undefined;
  randomizationEnabled: boolean;
  totalTimePlayed: number;
  numberOfGamesPlayed: number;
  playerLives: number;
  opponentLives: number;
  currentRound: number;
  averageWpmLast100: number,
  selectedLevel: number | null;
  levels: number[];
  forceMistakeCorrection: boolean; // switch for stopping at incorrect character
  noGameEndWithoutMistakeCorrection: boolean; // switch for needing all mistakes to be corrected before being able to end the game
  playerID: string;
  playerName: string;
  uniqueCorrectIndices: boolean[];
  gameId: string | null,
  numberOfWords: number,
}

function saveGuestProgress(levelNumber: number): void {
  const guestProgress = { lastUnlockedLevel: levelNumber };
  localStorage.setItem("guestProgress", JSON.stringify(guestProgress));
}

function loadGuestProgress(): number {
  const guestProgress = JSON.parse(localStorage.getItem("guestProgress") ?? "{}");
  return guestProgress.lastUnlockedLevel || 1; // Return 1 if lastUnlockedLevel is undefined or 0
}

function saveGuestCoins(coins: number): void {
  const guestCoins = { userCoins: coins };
  localStorage.setItem("guestCoins", JSON.stringify(guestCoins));
}

function loadGuestCoins(): number {
  const guestCoinsString = localStorage.getItem("guestCoins");
  const guestCoins = JSON.parse(guestCoinsString ?? "{}");
  let coins = guestCoins ? guestCoins.userCoins : 0;

  // Ensure the coins are a valid number; otherwise, default to 0
  if (isNaN(coins) || coins === null) {
    coins = 0;
  }
  return Number(coins); // Ensure the returned value is a number
}

export const useStore = defineStore({
  id: 'mainStore',
  state: (): State => {
    const storedState = JSON.parse(localStorage.getItem('store') ?? "{}");
    const userSession = storedState.userSession || null;
    return {
      currentIndex: 0,
      progressEnabled: storedState.progressEnabled ?? true,
      opponentWPM: storedState.opponentWPM || 40,
      opponentEnabled: storedState.opponentEnabled ?? true,
      userSession: userSession,
      lastUnlockedLevel: loadGuestProgress(),
      userCoins: loadGuestCoins(),
      mainMenuKey: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      wordsPerSecond: [],
      userStats: [],
      isGameStarted: false,
      isGameFinished: false,
      startTime: null as Date | null,
      currentWordStartTime: null as Date | null,
      endTime: null as Date | null,
      loading: false,
      startTyping: false,
      typed: {} as { [key: number]: string },
      typedIndices: [] as number[],
      isCapsLockOn: false,
      errors: [] as Array<{ attempted: string, expected: string, word: string }>,
      typingAllowed: false,
      selectedMode: "random",
      selectedWordLength: "3",
      randomizationEnabled: storedState.randomizationEnabled || false,
      totalTimePlayed: 0,
      numberOfGamesPlayed: 0,
      playerLives: 2,
      opponentLives: 2,
      currentRound: 1,
      averageWpmLast100: 0,
      selectedLevel: null,
      levels: Array.from({ length: 15 }, (_, index) => index + 1),
      forceMistakeCorrection: false,
      noGameEndWithoutMistakeCorrection: storedState.noGameEndWithoutMistakeCorrection ?? true,
      playerID: '',
      playerName: '',
      uniqueCorrectIndices: [],
      gameId: null,
      numberOfWords: storedState.numberOfWords || 50,
    };
  },
  actions: {
    setTrainingParams(mode: "text" | "words" | "random" | "single" | "keys" | "custom", wordLength: "3" | undefined) {
      this.selectedMode = mode;
      this.selectedWordLength = wordLength;
    },

    setModeFromRouter(mode: string) {
      if (["text", "words", "random", "single"].includes(mode)) {
        this.selectedMode = mode as "text" | "words" | "random" | "single";
      } else {
        this.selectedMode = "random"; // default to 'random' if the mode is not recognized
      }
    },

    setUserStats(stats: UserStat[]) {
      this.userStats = stats;
    },

    resetUserStats() {
      this.userStats = [];
    },

    getCurrentRank() {
      return RANKS[this.lastUnlockedLevel - 1];
    },

    getCurrentWpm() {
      return OPPONENT_WPM[this.lastUnlockedLevel - 1];
    },

    setOpponentWPM(wpm: number) {
      this.opponentWPM = wpm;
      localStorage.setItem('store', JSON.stringify(this.$state));
    },

    setOpponentEnabled(enabled: boolean) {
      this.opponentEnabled = enabled;
      localStorage.setItem('store', JSON.stringify(this.$state));
    },

    setNumberOfWords(numberOfWords: number) {
      this.numberOfWords = numberOfWords;
      localStorage.setItem('store', JSON.stringify(this.$state));
    },

    setUserSession(session: any) {
      this.userSession = session;
      localStorage.setItem('store', JSON.stringify(this.$state));
    },

    setLastUnlockedLevel(levelNumber: number) {
      this.lastUnlockedLevel = levelNumber;
      if (!this.userSession || !this.userSession.user) {
        saveGuestProgress(levelNumber);
      }
    },

    setUserCoins(coins: number) {
      this.userCoins = coins;
      if (!this.userSession || !this.userSession.user) {
        saveGuestCoins(coins); // Save to local storage if guest user
      }
    },

    reloadMainMenu() {
      this.mainMenuKey++;
    },

    incrementKeystrokes() {
      this.totalKeystrokes += 1;
    },

    resetKeystrokes() {
      this.totalKeystrokes = 0;
    },

    incrementCorrectKeystrokes() {
      this.correctKeystrokes += 1;
    },

    resetCorrectKeystrokes() {
      this.correctKeystrokes = 0;
    },

    setWordsPerSecond(words: string[][]) {
      this.wordsPerSecond = words;
    },

    updateWordsPerSecond(newWords: string[]) {
      this.wordsPerSecond.push(newWords);
    },

    resetWordsPerSecond() {
      this.wordsPerSecond = [];
    },

    async fetchUserCoins() {
      if (this.userSession && this.userSession.user) {
        const userId = this.userSession.user.id;
        const { data, error } = await supabase
          .from("profiles")
          .select("coins")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching user coins:", error);
          return;
        }

        this.setUserCoins(data.coins);
      } else {
        // Load guest coins from local storage
        const guestCoins = loadGuestCoins();
        this.setUserCoins(guestCoins);
      }
    },

    async fetchLastUnlockedLevel() {
      if (!this.userSession || !this.userSession.user) {
        return;
      }

      const userId = this.userSession.user.id;
      const { data, error } = await supabase
        .from("profiles")
        .select("last_unlocked_level")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching last unlocked level:", error);
        return;
      }

      this.setLastUnlockedLevel(data.last_unlocked_level || 1);
    },

    setProgressEnabled(enabled: boolean) {
      this.progressEnabled = enabled;
      localStorage.setItem('store', JSON.stringify(this.$state));
    },

    setNoEndGameWithoutCorrectionEnabled(enabled: boolean) {
      this.noGameEndWithoutMistakeCorrection = enabled;
      localStorage.setItem('store', JSON.stringify(this.$state));
    },

    setRandomizationEnabled(enabled: boolean) {
      this.randomizationEnabled = enabled;
      localStorage.setItem('store', JSON.stringify(this.$state));
    },

    setAverageWpmLast100(value: number) {
      this.averageWpmLast100 = value;
    },

    setSelectedLevel(level: number | null) {
      this.selectedLevel = level;
    },

    setLevels(levels: number[]) {
      this.levels = levels;
    },

    setForceMistakeCorrection(value: boolean) {
      this.forceMistakeCorrection = value;
    },

    setPlayerID(id: string) {
      this.playerID = id;
    },

    clearPlayerID() {
      this.playerID = '';
    },

    setupUniqueCorrectIndices(textLength: number) {
      this.uniqueCorrectIndices = Array<boolean>(textLength).fill(false);
    },

    resetUniqueCorrectIndices() {
      this.uniqueCorrectIndices = [];
    },

    setGameId(newGameId: string) {
      this.gameId = newGameId;
    },

    logout() {
      // actions on user logout
      const guestCoins = loadGuestCoins();
      this.setUserCoins(guestCoins);
      this.setUserSession(null);
      this.reloadMainMenu();
    },
  },
});



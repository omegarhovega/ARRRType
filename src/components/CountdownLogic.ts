import { ref } from 'vue';
import type { Ref } from 'vue';
import { DEFAULT_COUNTDOWN_VALUE } from './GameConstants';

interface CountdownLogic {
    countdown: Ref<number>;
    countdownFinished: Ref<boolean>;
    showCountdown: Ref<boolean>;
    stopCountdown: () => void;
    countdownStart: () => void;
    countdownInterval: Ref<number | null>;
}

export function useCountdownLogic(onCountdownEnd: () => void): CountdownLogic {
    const countdown = ref<number>(DEFAULT_COUNTDOWN_VALUE);
    const countdownFinished = ref<boolean>(false);
    const showCountdown = ref<boolean>(true);
    const countdownInterval = ref<number | null>(null);

    function stopCountdown() {
        console.log("Calling stopCountdown")
        if (countdownInterval.value !== null) {
            clearInterval(countdownInterval.value);
            countdownInterval.value = null;
        }
        countdownFinished.value = false;
        showCountdown.value = false; // Hide countdown immediately
    }

    function countdownStart() {
        console.log("Calling countdownStart")
        if (countdownInterval.value !== null) {
            clearInterval(countdownInterval.value);
        }

        countdown.value = DEFAULT_COUNTDOWN_VALUE;
        countdownFinished.value = false;
        showCountdown.value = true;
        console.log("current countdown, finished?, show?:", countdown.value, countdownFinished.value, showCountdown.value);

        countdownInterval.value = window.setInterval(() => {
            countdown.value -= 1;
            if (countdown.value < 1) {
                if (countdownInterval.value !== null) {
                    clearInterval(countdownInterval.value);
                }
                countdownFinished.value = true;
                onCountdownEnd();

                setTimeout(() => {
                    if (countdownFinished.value) {
                        // Only hide the countdown if it's actually finished (otherwise resetting game at countdown 0 will hide new countdown)
                        showCountdown.value = false;
                    }
                }, 500); // small delay for graphic to show
            }
        }, 1000);

    }

    return {
        countdown,
        countdownFinished,
        showCountdown,
        stopCountdown,
        countdownStart,
        countdownInterval,
    };
}

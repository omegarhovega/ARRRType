import { computed, watch, nextTick } from "vue";
import type { Ref, ComponentPublicInstance } from 'vue';
import { useStore } from "../../stores/store";

// Handles chevron animation behavior
// Position of chevron is based on current character position in DOM (can be calculated given fixed line height and rendering information from browser)
// Resizing window currently does not update position and correct positioning after resize requires an new user keystroke after resize
// Chevron has slight delay added to provide smooth transition (trade-off: at very high WPM speeds slight delay visible)
// Interacts with CSS styling of chevron div in components
export function useChevronAnimation(
    charSpans: Ref<(Element | ComponentPublicInstance)[]>,
    chevronTop: Ref<number>,
    chevronLeft: Ref<number>,
) {
    const store = useStore();
    let animationFrameId: number | null = null;
    let startingTime: number | null = null;

    const watchedCurrentIndex = computed(() => store.currentIndex);

    watch(watchedCurrentIndex, (newIndex) => {
        nextTick().then(() => {
            // Cancel any ongoing animation
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            if (newIndex === charSpans.value.length) {
                // Handle the case when the last character is typed
                moveChevronToEndOfText(chevronTop, chevronLeft, charSpans);
                return;
            }

            if (newIndex > charSpans.value.length) {
                console.warn("New index is out of bounds: ", newIndex);
                return; // Early return if newIndex is out of bounds
            }

            // Null check added here
            const textBoxElement = document.getElementById("speed-text");
            if (textBoxElement) {
                const textBoxRect = textBoxElement.getBoundingClientRect();

                const span = charSpans.value[newIndex];
                if (span instanceof HTMLElement) {
                    // relative positioning based on bounding div and relative positioning of span of current character index within the bounding div
                    const spanRect = span.getBoundingClientRect();
                    if (spanRect.width === 0 || spanRect.height === 0) {
                        console.warn("Span rect is collapsed or invisible for index: ", newIndex);
                        return; // Skip if spanRect is collapsed or invisible
                    }

                    const newTop = spanRect.top - textBoxRect.top; // *NOTE* sometimes reaching the end of the text, spanRect.top and spanRect.left seem to turn to 0 erroneously and newTop and newLeft turn to negative numbers
                    const newLeft = spanRect.left - textBoxRect.left; // *NOTE* could be that at some instances the character defaults to none (beyond last) and then spanRect defaults to none

                    const currentTop = chevronTop.value;
                    const currentLeft = chevronLeft.value;

                    startingTime = null;

                    // time of animated progression of chevron to next character
                    const animate = (time: number) => {
                        if (store.startTime === null) startingTime = time;

                        const progress = (time - startingTime!) / 100; // 100ms animation duration

                        if (progress < 1) {
                            chevronTop.value = currentTop + progress * (newTop - currentTop);
                            chevronLeft.value =
                                currentLeft + progress * (newLeft - currentLeft);
                            animationFrameId = requestAnimationFrame(animate);
                        } else {
                            chevronTop.value = newTop;
                            chevronLeft.value = newLeft;
                        }
                    };

                    animationFrameId = requestAnimationFrame(animate);
                }
            }
        });
    });
    return { chevronTop, chevronLeft };
}

export function moveChevronToEndOfText(
    chevronTop: Ref<number>,
    chevronLeft: Ref<number>,
    charSpans: Ref<(Element | ComponentPublicInstance)[]>
) {
    const lastSpanIndex = charSpans.value.length - 1;
    const textBoxElement = document.getElementById("speed-text");

    if (textBoxElement && lastSpanIndex >= 0) {
        const textBoxRect = textBoxElement.getBoundingClientRect();
        const lastSpan = charSpans.value[lastSpanIndex];

        if (lastSpan instanceof HTMLElement) {
            const spanRect = lastSpan.getBoundingClientRect();
            chevronTop.value = spanRect.top - textBoxRect.top;
            chevronLeft.value = spanRect.right - textBoxRect.left; // Position to the right of the last character
        }
    }
}

export function resetChevronPosition(
    chevronTop: Ref<number>,
    chevronLeft: Ref<number>
) {
    const textBoxElement = document.getElementById("speed-text");
    // important for relative chevron postion to adjust - scroll box again back to top, then no potential negative top margin is applied
    if (textBoxElement) {
        textBoxElement.scrollTop = 0;
    }
    chevronTop.value = 0;
    chevronLeft.value = 0;
}

const Chevron = {
    useChevronAnimation,
    moveChevronToEndOfText,
    resetChevronPosition,
};

export default Chevron;

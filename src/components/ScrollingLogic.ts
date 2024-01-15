import type { Ref } from 'vue';
import { useStore } from "../stores/store";

//imports DOM element with game text, updates scrolling position using browser functionality and hides DOM scroll bar (scrolling is handled with own function)
export function updateScrollPosition(scrollContainer: Ref<HTMLElement | null>) {
    const store = useStore();

    if (scrollContainer.value !== null) {
        // create char elements from text loaded
        const chars = (scrollContainer.value as HTMLElement).querySelectorAll(".char");
        // identify char element at current index
        const currentCharElement = chars[store.currentIndex] as HTMLElement;

        if (currentCharElement) {
            const charTop = currentCharElement.offsetTop;
            const lineHeight = 30; // Fixed line height, this is aligned with the speed-text div height of 90px for 3 lines shown (based on fixed font size)
            const linesToShow = 2; // Number of lines to show before scrolling

            // line of current char is deduced by calculating by dividing pixel distance of current char to top of DOM element by set lineheight
            const currentLine = Math.floor(charTop / lineHeight) + 1;

            // Calculate the visible area top and bottom based on scroll position
            const scrollAreaTop = scrollContainer.value.scrollTop;
            const scrollAreaBottom = scrollAreaTop + scrollContainer.value.clientHeight;

            // Determine the line at the bottom of the visible area
            const bottomLineVisible = Math.floor(scrollAreaBottom / lineHeight);

            // Scroll down if the current char is the first char on the 3rd line (in this setting always scrolls when second line end is reached, expect if 3rd line is last line of text)
            if (currentLine > bottomLineVisible - linesToShow + 1) {
                scrollContainer.value.scrollTop = (currentLine - linesToShow) * lineHeight;
            }

            // Scroll up when the current line is above the first visible line
            if (charTop < scrollAreaTop + lineHeight) {
                scrollContainer.value.scrollTop = Math.max(0, (currentLine - 1 - linesToShow) * lineHeight);
            }
        }
    }
};


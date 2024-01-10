import type { Ref } from 'vue';
import { useStore } from "../stores/store"; // Import the useStore function from the Pinia store

//updates scrolling position using sroll function included in browsers and hides sroll indicators, to check if full JS solution preferable (pot. slower)
// * NOTE * sometimes random scroll jumps when hitting space in Firefox
export function updateScrollPosition(scrollContainer: Ref<HTMLElement | null>) {
    const store = useStore();
    console.log("Calling updateScrollPosition");
    if (scrollContainer.value !== null) {
        const chars = (scrollContainer.value as HTMLElement).querySelectorAll(".char");
        console.log("chars,", chars)
        const currentCharElement = chars[store.currentIndex] as HTMLElement;
        console.log("chars HTML element,", currentCharElement)

        if (currentCharElement) {
            const charTop = currentCharElement.offsetTop;
            console.log("chars chartop,", charTop)
            const lineHeight = 30; // Fixed line height, this is aligned with the speed-text div height of 90px for 3 lines shown (*NOTE* could move to constants)
            const linesToShow = 2; // Number of lines to show before scrolling

            const currentLine = Math.floor(charTop / lineHeight) + 1;
            console.log("chars Current line:", currentLine);

            // Calculate the visible area top and bottom
            const scrollAreaTop = scrollContainer.value.scrollTop;
            const scrollAreaBottom = scrollAreaTop + scrollContainer.value.clientHeight;
            console.log("chars scrollarea top and bottom,", scrollAreaTop, scrollAreaBottom)
            console.log("chars scrollcontainer clientHeight,", scrollContainer.value.clientHeight)

            // Determine the line at the bottom of the visible area
            const bottomLineVisible = Math.floor(scrollAreaBottom / lineHeight);
            console.log("chars bottomlinevisible,", bottomLineVisible)

            // Scroll down when the current line is the first character on the 3rd line (or beyond)
            if (currentLine > bottomLineVisible - linesToShow + 1) {
                scrollContainer.value.scrollTop = (currentLine - linesToShow) * lineHeight;
                console.log("chars scrollContainer.value.scrollTop,", scrollContainer.value.scrollTop)
            }

            // Scroll up when the current line is above the first visible line
            // Adjusted to consider the entire line height
            if (charTop < scrollAreaTop + lineHeight) {
                scrollContainer.value.scrollTop = Math.max(0, (currentLine - 1 - linesToShow) * lineHeight);
                console.log("chars scrollContainer.value.scrollTop scroll up,", scrollContainer.value.scrollTop)
            }
        }
    }
};


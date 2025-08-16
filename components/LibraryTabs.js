export default class LibraryTabs {
    _navTabsContainer;
    _libraryContent;

    constructor({ navTabsContainer, libraryContent }) {
        this._navTabsContainer = navTabsContainer;
        this._libraryContent = libraryContent;

        if (!this._navTabsContainer || !this._libraryContent) {
            console.error("LibraryTabs: Missing required DOM elements.");
            return;
        }
        this._bindEvents();
        this._initialFilter();
    }

    _bindEvents() {
        this._navTabsContainer.addEventListener("click", (e) => {
            const clickedTab = e.target.closest(".nav-tab");
            if (!clickedTab) return;

            const currentActive =
                this._navTabsContainer.querySelector(".nav-tab.active");
            if (currentActive) {
                currentActive.classList.remove("active");
            }
            clickedTab.classList.add("active");

            const filter = clickedTab.dataset.filter;
            this.__filterLibraryItems(filter);
        });
    }

    __filterLibraryItems(filter) {
        const libraryItems =
            this._libraryContent.querySelectorAll(".library-item");
        libraryItems.forEach((item) => {
            let shouldShow = false;
            const subtitle =
                item
                    .querySelector(".item-subtitle")
                    ?.textContent.toLowerCase() || "";

            if (filter === "all") {
                shouldShow = true;
            } else if (filter === "playlists") {
                if (
                    subtitle.includes("playlist") ||
                    item.querySelector(".liked-songs")
                )
                    shouldShow = true;
            } else if (filter === "artists") {
                if (subtitle.includes("artist")) shouldShow = true;
            }

            item.style.display = shouldShow ? "flex" : "none";
        });
    }

    _initialFilter() {
        const initialActiveTab =
            this._navTabsContainer.querySelector(".nav-tab.active");
        if (initialActiveTab) {
            this.__filterLibraryItems(initialActiveTab.dataset.filter);
        }
    }
}

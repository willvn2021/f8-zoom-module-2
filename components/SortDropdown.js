export default class SortDropdown {
    _sortBtn;
    _sortBtnText;
    _sortDropdown;
    _libraryContent;
    _initialLibraryItems = [];

    constructor({ sortBtn, sortDropdown, libraryContent }) {
        this._sortBtn = sortBtn;
        this._sortDropdown = sortDropdown;
        this._libraryContent = libraryContent;
        this._sortBtnText = this._sortBtn.querySelector("#sortBtnText");

        if (
            !this._sortBtn ||
            !this._sortDropdown ||
            !this._libraryContent ||
            !this._sortBtnText
        ) {
            console.error("SortDropdown: Missing required DOM elements.");
            return;
        }

        // Chúng ta không lưu các mục ở đây nữa vì có thể nội dung
        // được tải bất đồng bộ (race condition).
        // Thay vào đó, chúng ta sẽ lưu ở lần sắp xếp đầu tiên.
        this._bindEvents();
    }

    _bindEvents() {
        //Bật tắt dropdown
        this._sortBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this._sortDropdown.classList.toggle("show");
        });

        //Đóng dropdown khi click ra ngoài
        document.addEventListener("click", (e) => {
            if (
                !this._sortDropdown.contains(e.target) &&
                !this._sortBtn.contains(e.target)
            ) {
                this._sortDropdown.classList.remove("show");
            }
        });

        //Xử lý khi click vào một tùy chọn sắp xếp
        this._sortDropdown.addEventListener("click", (e) => {
            const selectedItem = e.target.closest(".dropdown-item");
            if (!selectedItem) return;

            const sortType = selectedItem.dataset.sort;
            const selectedText = selectedItem.textContent.trim();

            this._sortBtnText.textContent = selectedText;
            this._sortDropdown.classList.remove("show");
            this._sortLibraryItems(sortType);
        });
    }

    _sortLibraryItems(sortType) {
        // LAZY INITIALIZATION: Nếu danh sách "ban đầu" của chúng ta rỗng
        // "chụp" lại trạng thái tại lần sắp xếp đầu tiên.
        if (
            this._initialLibraryItems.length === 0 &&
            this._libraryContent.children.length > 0
        ) {
            this._initialLibraryItems = Array.from(
                this._libraryContent.children
            );
        }

        let sortedItems;

        switch (sortType) {
            case "artists":
                // Luôn sắp xếp từ một bản sao của danh sách gốc đầy đủ
                sortedItems = [...this._initialLibraryItems].sort((a, b) => {
                    const aIsArtist = a
                        .querySelector(".item-subtitle")
                        ?.textContent.includes("Artist");
                    const bIsArtist = b
                        .querySelector(".item-subtitle")
                        ?.textContent.includes("Artist");
                    if (aIsArtist === bIsArtist) return 0;
                    return aIsArtist ? -1 : 1;
                });
                break;
            case "playlists":
                // Luôn sắp xếp từ một bản sao của danh sách gốc đầy đủ
                sortedItems = [...this._initialLibraryItems].sort((a, b) => {
                    const aIsPlaylist = a
                        .querySelector(".item-subtitle")
                        ?.textContent.includes("Playlist");
                    const bIsPlaylist = b
                        .querySelector(".item-subtitle")
                        ?.textContent.includes("Playlist");
                    if (aIsPlaylist === bIsPlaylist) return 0;
                    return aIsPlaylist ? -1 : 1;
                });
                break;
            case "recents":
            default:
                // Quay về trạng thái ban đầu đã lưu
                sortedItems = this._initialLibraryItems;
                break;
        }

        this._libraryContent.innerHTML = "";
        sortedItems.forEach((item) => this._libraryContent.appendChild(item));
    }
}

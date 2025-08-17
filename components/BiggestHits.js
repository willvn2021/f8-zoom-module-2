import httpRequest from "../utils/httpRequest.js";

export default class BiggestHits {
    constructor({ container }) {
        if (!container) {
            console.error(
                "BiggestHits component requires a container element."
            );
            return;
        }

        this.container = container;
        this.__loadAndRender();
    }

    async __loadAndRender() {
        try {
            const { albums } = await httpRequest.get("albums/popular?limit=20");
            this.container.innerHTML = ""; //Xóa nội dung cũ

            if (albums && albums.length > 0) {
                albums.forEach((album) => {
                    const hitCard = this.__createCard(album);
                    this.container.appendChild(hitCard);
                });
            } else {
                this.container.innerHTML =
                    '<p class="empty-list-message">Không có album nổi bật nào.</p>';
            }
        } catch (error) {
            console.error("Failed to load today's biggest hits:", error);
            this.container.innerHTML =
                '<p class="error-message">Không thể tải danh sách. Vui lòng thử lại.</p>';
        }
    }

    __createCard(album) {
        const card = document.createElement("div");
        card.className = "hit-card";
        card.dataset.albumId = album.id;

        card.innerHTML = `
            <div class="hit-card-cover">
                <img src="${album.cover_image_url}" alt="${album.title}">
                <button class="hit-play-btn">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="hit-card-info">
                <h3 class="hit-card-title">${album.title}</h3>
                <p class="hit-card-artist">${album.artist_name}</p>
            </div>
        `;

        return card;
    }
}

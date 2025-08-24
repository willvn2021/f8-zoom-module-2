import httpRequest from "../utils/httpRequest.js";

export default class PopularArtists {
    constructor({ container }) {
        if (!container) {
            console.error(
                "PopularArtists component requires a container element."
            );
            return;
        }
        this.container = container;
        this._loadAndRender();
    }

    async _loadAndRender() {
        try {
            const { artists } = await httpRequest.get(
                "artists/trending?limit=20"
            );
            this.container.innerHTML = ""; //Xóa nội dung cũ

            if (artists && artists.length > 0) {
                artists.forEach((artist) => {
                    const artistCard = this._createCard(artist);
                    this.container.appendChild(artistCard);
                });
            } else {
                this.container.innerHTML =
                    '<p class="empty-list-message">Không có nghệ sĩ nổi bật nào.</p>';
            }
        } catch (error) {
            console.error("Failed to load popular artists:", error);
            this.container.innerHTML =
                '<p class="error-message">Không thể tải danh sách nghệ sĩ. Vui lòng thử lại.</p>';
        }
    }

    _createCard(artist) {
        const card = document.createElement("div");
        card.className = "artist-card";
        card.dataset.artistId = artist.id;

        card.innerHTML = `
            <div class="artist-card-cover">
                <img src="${artist.image_url}" alt="${artist.name}">
                <button class="artist-play-btn">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="artist-card-info">
                <h3 class="artist-card-name">${artist.name}</h3>
                <p class="artist-card-type">Artist</p>
            </div>
        `;
        return card;
    }
}

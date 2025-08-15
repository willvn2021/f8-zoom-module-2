function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export default class Player {
    constructor({ trackListContainer }) {
        // --- DOM Elements ---
        this.audio = new Audio();
        this.trackListContainer = trackListContainer; // bọc bên ngoài

        // Player Bar
        this.playerImage = document.querySelector(".player-image");
        this.playerTitle = document.querySelector(".player-title");
        this.playerArtist = document.querySelector(".player-artist");

        // Controls
        this.playPauseBtn = document.querySelector(".player-center .play-btn");
        this.playPauseIcon = this.playPauseBtn.querySelector("i");
        this.prevBtn = document.querySelector(
            '.player-controls button[data-tooltip="Trước"]'
        );
        this.nextBtn = document.querySelector(
            '.player-controls button[data-tooltip="Tiếp theo"]'
        );
        this.shuffleBtn = document.querySelector(
            '.player-controls button[data-tooltip*="ngẫu nhiên"]'
        );
        this.repeatBtn = document.querySelector(
            '.player-controls button[data-tooltip*="lặp lại"]'
        );

        // Progress Bar
        const progressContainer = document.querySelector(".progress-container");
        this.progressBar = progressContainer.querySelector(".progress-bar");
        this.progressFill = this.progressBar.querySelector(".progress-fill");
        const timeElements = progressContainer.querySelectorAll(".time");
        this.currentTimeEl = timeElements[0];
        this.durationEl = timeElements[1];

        // --- State ---
        this.state = {
            currentQueue: [],
            originalQueue: [],
            currentTrackIndex: -1,
            isPlaying: false,
            currentTrack: null,
            isShuffled: false,
            repeatMode: "none", // 'none', 'all', 'one'
        };
        this.trackDataMap = new Map();

        // --- Initialization ---
        this.bindEvents();
    }

    bindEvents() {
        // Lắng nghe sự kiện trên các nút
        this.playPauseBtn.addEventListener("click", () =>
            this.togglePlayPause()
        );
        this.prevBtn.addEventListener("click", () => this.playPrevious());
        this.nextBtn.addEventListener("click", () => this.playNext());
        this.shuffleBtn.addEventListener("click", () => this.toggleShuffle());
        this.repeatBtn.addEventListener("click", () => this.toggleRepeat());

        // Lắng nghe sự kiện trên thẻ audio
        this.audio.addEventListener("play", () => this.handlePlay());
        this.audio.addEventListener("pause", () => this.handlePause());
        this.audio.addEventListener("ended", () => this.handleTrackEnd());
        this.audio.addEventListener("timeupdate", () => this.updateProgress());
        this.audio.addEventListener("loadedmetadata", () =>
            this.handleLoadedMetadata()
        );

        // Lắng nghe sự kiện tua (seek)
        this.progressBar.addEventListener("click", (e) => this.seek(e));

        // Lắng nghe sự kiện click vào danh sách bài hát
        this.trackListContainer.addEventListener("click", (e) => {
            const trackItem = e.target.closest(".track-item");
            if (trackItem && trackItem.dataset.trackId) {
                this.playTrackById(trackItem.dataset.trackId);
            }
        });
    }

    // --- Public Methods (API for other parts of the app) ---

    loadNewQueue(tracks, trackDataMap) {
        this.trackDataMap = trackDataMap;
        this.state.originalQueue = tracks;

        if (this.state.isShuffled) {
            this.state.currentQueue = shuffleArray([
                ...this.state.originalQueue,
            ]);
        } else {
            this.state.currentQueue = this.state.originalQueue;
        }
    }

    playTrackById(trackId) {
        const trackToPlay = this.trackDataMap.get(trackId);
        const trackIndex = this.state.currentQueue.findIndex(
            (t) => t.id === trackId
        );

        if (trackToPlay && trackIndex > -1) {
            this.state.currentTrack = trackToPlay;
            this.state.currentTrackIndex = trackIndex;
            this.loadAndPlayCurrentTrack();
        } else {
            console.error("Không tìm thấy bài hát trong hàng đợi:", trackId);
        }
    }

    // --- Internal Logic Methods ---

    loadAndPlayCurrentTrack() {
        const track = this.state.currentTrack;
        if (!track) return;

        this.updatePlayerUI(track);
        this.durationEl.textContent = "0:00";
        this.audio.src = track.audio_url;
        this.audio.play().catch((e) => console.error("Lỗi khi phát nhạc:", e));
        this.updatePlayingTrackUI();
    }

    togglePlayPause() {
        if (!this.state.currentTrack) return;
        this.state.isPlaying ? this.audio.pause() : this.audio.play();
    }

    playNext() {
        if (this.state.currentQueue.length === 0) return;

        const isLastTrack =
            this.state.currentTrackIndex === this.state.currentQueue.length - 1;

        if (this.state.repeatMode === "none" && isLastTrack) {
            this.audio.pause();
            this.audio.currentTime = 0;
            return; // Dừng phát nhạc
        }

        this.state.currentTrackIndex =
            (this.state.currentTrackIndex + 1) % this.state.currentQueue.length;
        this.state.currentTrack =
            this.state.currentQueue[this.state.currentTrackIndex];
        this.loadAndPlayCurrentTrack();
    }

    playPrevious() {
        if (this.state.currentQueue.length === 0) return;

        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        this.state.currentTrackIndex =
            (this.state.currentTrackIndex -
                1 +
                this.state.currentQueue.length) %
            this.state.currentQueue.length;
        this.state.currentTrack =
            this.state.currentQueue[this.state.currentTrackIndex];
        this.loadAndPlayCurrentTrack();
    }

    toggleShuffle() {
        this.state.isShuffled = !this.state.isShuffled;
        this.shuffleBtn.classList.toggle("active", this.state.isShuffled);
        this.shuffleBtn.dataset.tooltip = this.state.isShuffled
            ? "Tắt phát ngẫu nhiên"
            : "Bật phát ngẫu nhiên";

        if (this.state.isShuffled) {
            const currentTrackId = this.state.currentTrack?.id;
            this.state.currentQueue = shuffleArray([
                ...this.state.originalQueue,
            ]);
            if (currentTrackId) {
                this.state.currentTrackIndex =
                    this.state.currentQueue.findIndex(
                        (t) => t.id === currentTrackId
                    );
            }
        } else {
            const currentTrackId = this.state.currentTrack?.id;
            this.state.currentQueue = this.state.originalQueue;
            if (currentTrackId) {
                this.state.currentTrackIndex =
                    this.state.currentQueue.findIndex(
                        (t) => t.id === currentTrackId
                    );
            }
        }
    }

    toggleRepeat() {
        const modes = ["none", "all", "one"];
        const currentModeIndex = modes.indexOf(this.state.repeatMode);
        this.state.repeatMode = modes[(currentModeIndex + 1) % modes.length];
        this.updateRepeatButton();
    }

    seek(e) {
        const width = this.progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;

        if (duration) {
            this.audio.currentTime = (clickX / width) * duration;
        }
    }

    // --- Event Handlers (Gom vào đây để gọi hàm nhìn cho gọn) ---

    handlePlay() {
        this.state.isPlaying = true;
        this.updatePlayPauseButton(true);
    }

    handlePause() {
        this.state.isPlaying = false;
        this.updatePlayPauseButton(false);
    }

    handleTrackEnd() {
        if (this.state.repeatMode === "one") {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            this.playNext();
        }
    }

    handleLoadedMetadata() {
        this.durationEl.textContent = formatTime(this.audio.duration);
    }

    // --- UI Update Methods ---

    updateProgress() {
        if (this.audio.duration) {
            const progressPercent =
                (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = `${progressPercent}%`;
            this.currentTimeEl.textContent = formatTime(this.audio.currentTime);
        }
    }

    updatePlayPauseButton(isPlaying) {
        if (isPlaying) {
            this.playPauseIcon.classList.replace("fa-play", "fa-pause");
            this.playPauseBtn.dataset.tooltip = "Tạm dừng";
        } else {
            this.playPauseIcon.classList.replace("fa-pause", "fa-play");
            this.playPauseBtn.dataset.tooltip = "Phát";
        }
    }

    updateRepeatButton() {
        const icon = this.repeatBtn.querySelector("i");
        if (this.state.repeatMode === "none") {
            this.repeatBtn.classList.remove("active");
            icon.classList.remove("fa-repeat-1"); // FontAwesome 6 dùng fa-repeat-1
            this.repeatBtn.dataset.tooltip = "Bật lặp lại";
        } else {
            this.repeatBtn.classList.add("active");
            if (this.state.repeatMode === "all") {
                icon.classList.remove("fa-repeat-1");
                this.repeatBtn.dataset.tooltip = "Bật lặp lại một bài";
            } else {
                // 'one'
                icon.classList.add("fa-repeat-1");
                this.repeatBtn.dataset.tooltip = "Tắt lặp lại";
            }
        }
    }

    updatePlayerUI(track) {
        if (!track) return;
        this.playerImage.src =
            track.album?.cover_image_url ||
            track.image_url ||
            "placeholder.svg?height=56&width=56";
        this.playerTitle.textContent = track.title;
        this.playerArtist.textContent = track.artist_name;
    }

    updatePlayingTrackUI() {
        this.trackListContainer
            .querySelectorAll(".track-item")
            .forEach((item) => item.classList.remove("playing"));

        if (this.state.currentTrack) {
            const currentTrackItem = this.trackListContainer.querySelector(
                `.track-item[data-track-id="${this.state.currentTrack.id}"]`
            );
            if (currentTrackItem) {
                currentTrackItem.classList.add("playing");
            }
        }
    }
}

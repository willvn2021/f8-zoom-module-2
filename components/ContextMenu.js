import httpRequest from "../utils/httpRequest.js";
import { showToast } from "../utils/showToast.js";

export default class ContextMenu {
    constructor({ contextMenuElement, targetContainer, onPlaylistDeleted }) {
        if (!contextMenuElement || !targetContainer) {
            console.error(
                "ContextMenu requires a menu element and a target container."
            );
            return;
        }
        this.menu = contextMenuElement;
        this.target = targetContainer;
        this.onPlaylistDeleted = onPlaylistDeleted;
        this.currentTargetItem = null;

        this._init();
    }

    _init() {
        this.target.addEventListener(
            "contextmenu",
            this._handleContextMenu.bind(this)
        );
        this.menu.addEventListener("click", this._handleActionClick.bind(this));

        //Lắng nghe sự kiện click và key để đóng menu
        document.addEventListener("click", this._close.bind(this));
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this._close();
        });
    }

    _handleContextMenu(e) {
        e.preventDefault();

        this.currentTargetItem = e.target.closest(".library-item");
        if (!this.currentTargetItem) {
            this._close();
            return;
        }

        const subtitle =
            this.currentTargetItem.querySelector(".item-subtitle")
                ?.textContent || "";
        const isArtist = subtitle.includes("Artist");
        const isPlaylist =
            subtitle.includes("Playlist") ||
            this.currentTargetItem.querySelector(".liked-songs"); //Liked Songs là một Playlist đặc biệt

        this._populate({ isArtist, isPlaylist });
        this._position(e);
        this.menu.classList.add("show");
    }

    async _handleActionClick(e) {
        const actionItem = e.target.closest("[data-action]");
        if (!actionItem) return;

        const action = actionItem.dataset.action;
        if (action === "delete") await this.__deletePlaylist();

        this._close();
    }

    async _deletePlaylist() {
        if (!this.currentTargetItem) return;

        const playlistId = this.currentTargetItem.dataset.playlistId;
        const playlistName =
            this.currentTargetItem.querySelector(".item-title").textContent;

        if (!playlistId) return;

        try {
            await httpRequest.delete(`playlists/${playlistId}`);
            showToast(`Đã xóa playlist "${playlistName}"`, "success");
            this.currentTargetItem.remove();

            if (this.onPlaylistDeleted) {
                this.onPlaylistDeleted(playlistId);
            }
        } catch (error) {
            console.error("Không thể xóa playlist:", error);
            showToast("Không thể xóa playlist. Vui lòng thử lại.", "error");
        }
    }

    _populate({ isArtist, isPlaylist }) {
        this.menu.innerHTML = "";

        if (isArtist) {
            this.menu.innerHTML = `<div class="dropdown-item" data-action="unfollow"><i class="fas fa-user-minus"></i><span>Unfollow</span></div>`;
        } else if (isPlaylist) {
            this.menu.innerHTML = `<div class="dropdown-item" data-action="remove-from-profile"><i class="fas fa-minus-circle"></i><span>Remove from profile</span></div><div class="dropdown-item" data-action="delete"><i class="fas fa-trash"></i><span>Delete</span></div>`;
        }
    }

    _position(e) {
        const { clientX: mouseX, clientY: mouseY } = e;
        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
        const { offsetWidth: menuWidth, offsetHeight: menuHeight } = this.menu;

        const x =
            mouseX + menuWidth > windowWidth ? mouseX - menuWidth : mouseX;
        const y =
            mouseY + menuHeight > windowHeight ? mouseY - menuHeight : mouseY;

        this.menu.style.top = `${y}px`;
        this.menu.style.left = `${x}px`;
    }

    _close() {
        this.menu.classList.remove("show");
        this.currentTargetItem = null;
    }
}

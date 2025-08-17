import httpRequest from "./utils/httpRequest.js";
import Player from "./components/Player.js";
import SortDropdown from "./components/SortDropdown.js";
import LibraryTabs from "./components/LibraryTabs.js";
import ContextMenu from "./components/ContextMenu.js";
import { showToast } from "./utils/showToast.js";
import BiggestHits from "./components/BiggestHits.js";

const likedTracks = new Set();
//Lưu lại các Track người dùng đã thích
async function fetchAndStoreLikedTracks() {
    if (!localStorage.getItem("accessToken")) {
        likedTracks.clear();
        return;
    }
    try {
        const { tracks } = await httpRequest.get(
            "me/tracks/liked?limit=20&offset=0"
        );
        likedTracks.clear();
        if (tracks && Array.isArray(tracks)) {
            tracks.forEach((track) => likedTracks.add(track.id));
        }
    } catch (error) {
        console.error("Không thể tải danh sách bài hát đã thích:", error);
    }
}
//Function xử lý Like/Unlike Track
async function handleLikeTrack(button) {
    const trackId = button.dataset.trackId;
    if (!trackId) return;

    const wasLikedAccordingToUI = button.classList.contains("active");

    // Cập nhật giao diện
    button.classList.toggle("active");
    button.dataset.tooltip = wasLikedAccordingToUI
        ? "Lưu vào Thư viện"
        : "Xóa khỏi Thư viện";
    try {
        if (wasLikedAccordingToUI) {
            // Nếu UI đang hiển thị là "đã thích" -> thực hiện bỏ thích
            await httpRequest.delete(`tracks/${trackId}/like`);
            likedTracks.delete(trackId);
            showToast("Đã xóa khỏi Thư viện", "success");
        } else {
            // Nếu UI đang hiển thị là "chưa thích" -> thực hiện thích
            await httpRequest.post(`tracks/${trackId}/like`);
            likedTracks.add(trackId);
            showToast("Đã thêm vào Thư viện", "success");
        }
    } catch (error) {
        console.error("Lỗi khi thích/bỏ thích bài hát:", error);
        //Back lại giao diện nếu lỗi
        button.classList.toggle("active");
        // Hoàn tác lại tooltip
        button.dataset.tooltip = wasLikedAccordingToUI
            ? "Xóa khỏi Thư viện"
            : "Lưu vào Thư viện";
        showToast("Có lỗi xảy ra. Vui lòng thử lại.", "error");
    }
}

// Auth Modal Functionality
document.addEventListener("DOMContentLoaded", function () {
    // Get DOM elements
    const signupBtn = document.querySelector(".signup-btn");
    const loginBtn = document.querySelector(".login-btn");
    const authModal = document.getElementById("authModal");
    const modalClose = document.getElementById("modalClose");
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");
    const showLoginBtn = document.getElementById("showLogin");
    const showSignupBtn = document.getElementById("showSignup");
    document
        .querySelectorAll(".toggle-password-visibility")
        .forEach(setupPasswordVisibilityToggle);

    // Function to show signup form
    function showSignupForm() {
        signupForm.style.display = "block";
        loginForm.style.display = "none";
    }

    // Function to show login form
    function showLoginForm() {
        signupForm.style.display = "none";
        loginForm.style.display = "block";
    }

    // Function to open modal
    function openModal() {
        authModal.classList.add("show");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    // Open modal with Sign Up form when clicking Sign Up button
    signupBtn.addEventListener("click", function () {
        showSignupForm();
        openModal();
    });

    // Open modal with Login form when clicking Login button
    loginBtn.addEventListener("click", function () {
        showLoginForm();
        openModal();
    });

    // Close modal function
    function closeModal() {
        authModal.classList.remove("show");
        document.body.style.overflow = "auto"; // Restore scrolling
    }

    // Close modal when clicking close button
    modalClose.addEventListener("click", closeModal);

    // Close modal when clicking overlay (outside modal container)
    authModal.addEventListener("click", function (e) {
        if (e.target === authModal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && authModal.classList.contains("show")) {
            closeModal();
        }
    });

    // Switch to Login form
    showLoginBtn.addEventListener("click", function () {
        showLoginForm();
    });

    // Switch to Signup form
    showSignupBtn.addEventListener("click", function () {
        showSignupForm();
    });

    //SignUp Form
    signupForm
        .querySelector(".auth-form-content")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            clearFormErrors(signupForm);

            const emailInput = document.querySelector("#signupEmail");
            const email = emailInput.value;
            const passwordInput = document.querySelector("#signupPassword");
            const password = passwordInput.value;

            const credentials = {
                email,
                password,
            };

            try {
                const { user, access_token } = await httpRequest.post(
                    "auth/register",
                    credentials
                );
                localStorage.setItem("accessToken", access_token);
                localStorage.setItem("currentUser", JSON.stringify(user));
                updateCurrentUser(user);
                showToast("Đăng ký thành công!", "success");
                closeModal();
            } catch (error) {
                if (error.response?.error) {
                    const { code, message, details } = error.response.error;

                    if (code === "EMAIL_EXISTS") {
                        displayFormError(emailInput, message);
                    } else if (code === "VALIDATION_ERROR" && details) {
                        //Gom nhóm lỗi theo field
                        const errorsByField = details.reduce((acc, detail) => {
                            if (!acc[detail.field]) {
                                acc[detail.field] = [];
                            }
                            acc[detail.field].push(detail.message);
                            return acc;
                        }, {});

                        //Hiển thị các lỗi 1 lúc
                        if (errorsByField.password) {
                            displayFormError(
                                passwordInput,
                                errorsByField.password.join("<br>")
                            );
                        }
                    }
                }
            }
        });

    //Login Form
    loginForm
        .querySelector(".auth-form-content")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            clearFormErrors(loginForm);

            const emailInput = document.querySelector("#loginEmail");
            const email = emailInput.value;
            const passwordInput = document.querySelector("#loginPassword");
            const password = passwordInput.value;

            const credentials = {
                email,
                password,
            };

            try {
                const { user, access_token } = await httpRequest.post(
                    "auth/login",
                    credentials
                );

                localStorage.setItem("accessToken", access_token);
                localStorage.setItem("currentUser", JSON.stringify(user));

                updateCurrentUser(user);
                showToast("Đăng nhập thành công!", "success");
                closeModal();

                const authButtons = document.querySelector(".auth-buttons");
                const userInfo = document.querySelector(".user-info");
                authButtons.classList.remove("show");
                userInfo.classList.add("show");
            } catch (error) {
                if (error.response?.error) {
                    const { code, message } = error.response.error;

                    if (code === "INVALID_CREDENTIALS") {
                        displayFormError(passwordInput, message);
                    } else if (code === "VALIDATION_ERROR") {
                        displayFormError(emailInput, message);
                    }
                }
            }
        });
});

//Function Clear Form Error Message
function clearFormErrors(formElement) {
    formElement.querySelectorAll(".form-group.invalid").forEach((group) => {
        group.classList.remove("invalid");
        const errorMsg = group.querySelector(".error-message");
        if (errorMsg) {
            errorMsg.remove();
        }
    });
}

//Function Error Message Form
function displayFormError(inputElement, message) {
    const formGroup = inputElement.closest(".form-group");
    if (!formGroup) return;

    //Xóa báo lỗi mặc định
    const oldError = formGroup.querySelector(".error-message");
    if (oldError) oldError.remove();

    formGroup.classList.add("invalid");
    //Tạo lại phần tử báo lỗi
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
    `;
    formGroup.appendChild(errorDiv);
}

/**
 * Lấy thông tin người dùng hiện tại từ localStorage
 */
function getCurrentUserFromStorage() {
    try {
        // 1. Kiểm tra xem localStorage có tồn tại không (quan trọng cho SSR hoặc chế độ bảo mật)
        if (typeof localStorage === "undefined" || localStorage === null) {
            console.warn("localStorage không khả dụng.");
            return null;
        }

        const storedUser = localStorage.getItem("currentUser");

        // 2. Kiểm tra xem dữ liệu có tồn tại và không phải là các chuỗi không hợp lệ
        if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
            // 3. Parse dữ liệu JSON
            return JSON.parse(storedUser);
        }

        return null;
    } catch (e) {
        console.error(
            "Lỗi khi lấy hoặc parse dữ liệu người dùng từ localStorage:",
            e
        );
        // Tùy chọn: Xóa dữ liệu bị hỏng để tránh lỗi lặp lại trong tương lai
        // localStorage.removeItem("currentUser");
        return null;
    }
}

// User Menu Dropdown Functionality
document.addEventListener("DOMContentLoaded", function () {
    const userAvatar = document.getElementById("userAvatar");
    const userDropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    // Toggle dropdown when clicking avatar
    userAvatar.addEventListener("click", function (e) {
        e.stopPropagation();
        userDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
        if (
            !userAvatar.contains(e.target) &&
            !userDropdown.contains(e.target)
        ) {
            userDropdown.classList.remove("show");
        }
    });

    // Close dropdown when pressing Escape
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && userDropdown.classList.contains("show")) {
            userDropdown.classList.remove("show");
        }
    });

    // Handle logout button click
    logoutBtn.addEventListener("click", function () {
        // Close dropdown first
        userDropdown.classList.remove("show");

        console.log("Logout clicked");
        // TODO: Students will implement logout logic here
        localStorage.removeItem("accessToken");
        localStorage.removeItem("currentUser");
        likedTracks.clear(); // Xóa danh sách bài hát đã thích khi đăng xuất

        //Cập nhật lại giao diện
        const authButtons = document.querySelector(".auth-buttons");
        const userInfo = document.querySelector(".user-info");

        userInfo.classList.remove("show");
        authButtons.classList.add("show");
    });
});

//Login
document.addEventListener("DOMContentLoaded", async () => {
    const authButtons = document.querySelector(".auth-buttons");
    const userInfo = document.querySelector(".user-info");

    try {
        const { user } = await httpRequest.get("users/me");
        updateCurrentUser(user);
        userInfo.classList.add("show");
    } catch (error) {
        authButtons.classList.add("show");
    }
});

//ToolTip với class 'has-tooltip'
document.addEventListener("DOMContentLoaded", function () {
    const tooltipEl = document.createElement("div");
    tooltipEl.className = "spotify-tooltip";
    document.body.appendChild(tooltipEl);

    const triggers = document.querySelectorAll(".has-tooltip");
    let showTimeout;

    //Gắn sự kiện
    triggers.forEach((trigger) => {
        trigger.addEventListener("mouseenter", () => {
            const tooltipText = trigger.dataset.tooltip;
            if (!tooltipText) return;

            //Gắn nội dung cho tooltip
            tooltipEl.textContent = tooltipText;

            //Lấy vị trí của button
            const triggerRect = trigger.getBoundingClientRect();

            //Công thức tính vị trí tooltip dựa trên vị trí Button / Top căn đỉnh của button / Left căn giữa button
            const top = triggerRect.top;
            const left = triggerRect.left + triggerRect.width / 2; //Ra 1 nửa là left

            tooltipEl.style.top = `${top}px`;
            tooltipEl.style.left = `${left}px`;

            //Set độ trễ, tránh bị chớp khi rê chuột
            showTimeout = setTimeout(() => {
                tooltipEl.classList.add("show");
            }, 150);
        });

        trigger.addEventListener("mouseleave", () => {
            //Xóa timeout và ẩn tooltip khi rê chuột bỏ qua
            clearTimeout(showTimeout);
            tooltipEl.classList.remove("show");
        });
    });
});

async function updateCurrentUser(user) {
    const userName = document.querySelector("#user-name");
    const userAvatar = document.querySelector("#user-avatar");

    if (user.avatar_url) {
        userAvatar.src = user.avatar_url;
    }
    if (user.email) {
        userName.textContent = user.email;
    }

    // Sau khi cập nhật thông tin người dùng, tải danh sách bài hát đã thích
    await fetchAndStoreLikedTracks();
}

//Function Visibility Password
function setupPasswordVisibilityToggle(toggleBtn) {
    const passwordInputWrapper = toggleBtn.closest(".password-input-wrapper");
    if (!passwordInputWrapper) return;

    const passwordInput = passwordInputWrapper.querySelector(".form-input");
    const icon = toggleBtn.querySelector("i");

    if (!passwordInput || !icon) return;

    toggleBtn.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        icon.classList.toggle("fa-eye-slash", isPassword);
        icon.classList.toggle("fa-eye", !isPassword);
    });
}

// Khởi tạo Sort Dropdown
document.addEventListener("DOMContentLoaded", () => {
    const sortBtn = document.getElementById("sortBtn");
    const sortDropdown = document.getElementById("sortDropdown");
    const libraryContent = document.querySelector(".library-content");

    if (sortBtn && sortDropdown && libraryContent) {
        new SortDropdown({
            sortBtn,
            sortDropdown,
            libraryContent,
        });
    }
});

// Khởi tạo chức năng lọc bằng Tab
document.addEventListener("DOMContentLoaded", () => {
    const navTabsContainer = document.querySelector(".nav-tabs");
    const libraryContent = document.querySelector(".library-content");

    if (navTabsContainer && libraryContent) {
        new LibraryTabs({
            navTabsContainer,
            libraryContent,
        });
    }
});

//Function tạo các Element Artist
function createArtistLibraryItem(artist) {
    const item = document.createElement("div");
    item.className = "library-item";
    item.dataset.artistId = artist.id;

    item.innerHTML = `
        <img
            src="${artist.image_url}"
            alt="${artist.name}"
            class="item-image"
        />
        <div class="item-info">
            <div class="item-title">${artist.name}</div>
            <div class="item-subtitle">Artist</div>
        </div>
    `;
    return item;
}

//Function tạo các Element Playlist
function createPlaylistLibraryItem(playlist) {
    const item = document.createElement("div");
    item.className = "library-item";

    // Xử lý đặc biệt cho "Liked Songs"

    if (playlist.name === "Liked Songs") {
        item.innerHTML = `
            <div class="item-icon liked-songs">
                <i class="fas fa-heart"></i>
            </div>
            <div class="item-info">
                <div class="item-title">Liked Songs</div>
                <div class="item-subtitle">
                    <i class="fas fa-thumbtack"></i>
                    Playlist • ${playlist.total_tracks} songs
                </div>
            </div>
        `;
        item.dataset.type = "liked-songs";
    } else {
        let ownerName = playlist.user_display_name || playlist.user_username;
        //Xử lý trường hợp nếu user_display_name và playlist.user_username null thì lấy 6 ký tự đầu của email fill vào Subtitle
        if (!ownerName) {
            // Fallback: Lấy email của người dùng hiện tại từ DOM
            const userEmail = document.getElementById("user-name")?.textContent;
            if (userEmail) {
                const emailUsername = userEmail.split("@")[0];
                // Lấy 6 ký tự đầu của phần tên email
                ownerName = emailUsername.substring(0, 6);
            }
        }
        item.innerHTML = `
            <img
                src="${
                    playlist.image_url || "placeholder.svg?height=48&width=48"
                }"
                alt="${playlist.name}"
                class="item-image"
            />
            <div class="item-info">
                <div class="item-title">${playlist.name}</div>
                <div class="item-subtitle">Playlist • ${
                    ownerName || "You"
                }</div>
            </div>
        `;
        item.dataset.playlistId = playlist.id;
    }
    return item;
}

// Render Library Artists and Playlists
document.addEventListener("DOMContentLoaded", async () => {
    const libraryContent = document.querySelector(".library-content");
    if (!libraryContent) return;

    try {
        // Lấy danh sách nghệ sĩ và playlist song song để tối ưu tốc độ
        const [{ artists }, { playlists }] = await Promise.all([
            httpRequest.get("artists?limit=20&offset=0"),
            httpRequest.get("me/playlists"), // Lấy playlist của người dùng đã đăng nhập
        ]);

        // Tìm và đưa "Liked Songs" lên đầu tiên
        const likedSongsPlaylist = playlists?.find(
            (p) => p.name === "Liked Songs"
        );
        if (likedSongsPlaylist) {
            try {
                // Lấy tổng số bài hát đã thích trong API
                const { pagination } = await httpRequest.get(
                    "me/tracks/liked?limit=20&offset=0"
                );
                likedSongsPlaylist.total_tracks = pagination.total;
            } catch (err) {
                console.error("Không thể lấy số lượng bài hát đã thích:", err);
                // Giữ nguyên giá trị từ playlist nếu API lỗi
            }
            const likedSongsItem =
                createPlaylistLibraryItem(likedSongsPlaylist);
            libraryContent.prepend(likedSongsItem);
        }

        // Render các playlist còn lại (không bao gồm "Liked Songs")
        const otherPlaylists = playlists?.filter(
            (p) => p.name !== "Liked Songs"
        );
        otherPlaylists?.forEach((playlist) => {
            libraryContent.appendChild(createPlaylistLibraryItem(playlist));
        });

        // Render các nghệ sĩ
        artists?.forEach((artist) => {
            libraryContent.appendChild(createArtistLibraryItem(artist));
        });
    } catch (error) {
        console.error("Failed to load library artists:", error);
    }
});

//Tạo Element Popular artists card
function createPopularArtistCard(artist) {
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

//Render ra danh sách Popular artists card
document.addEventListener("DOMContentLoaded", async () => {
    const artistsGrid = document.querySelector(".artists-grid");
    if (!artistsGrid) return;

    try {
        const { artists } = await httpRequest.get("artists/trending?limit=20");
        artistsGrid.innerHTML = "";

        artists.forEach((artist) => {
            const artistCard = createPopularArtistCard(artist);
            artistsGrid.appendChild(artistCard);
        });
    } catch (error) {
        console.error("Failed to load popular artists:", error);
    }
});

// Khởi tạo Today's Biggest Hits
document.addEventListener("DOMContentLoaded", () => {
    const hitsGrid = document.querySelector(".hits-grid");
    if (hitsGrid) {
        new BiggestHits({ container: hitsGrid });
    }
});

//Xử lý điều hướng danh sách phát  & hiển thị
document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.querySelector(".main-content");
    const homeView = document.getElementById("homeView");
    const artistView = document.getElementById("artistView");
    const logo = document.querySelector(".sidebar .logo");
    const homeBtn = document.querySelector(".home-btn");
    const libraryContent = document.querySelector(".library-content");
    const followBtn = document.getElementById("followBtn");
    const createPlaylistBtn = document.querySelector(".sidebar .create-btn");
    const imageUploader = document.getElementById("imageUploader");
    const heroImageWrapper = artistView.querySelector(".hero-image-wrapper");
    const trackListContainer = artistView.querySelector(".track-list");
    const playPauseBtn = document.querySelector(".player-center .play-btn");
    const shuffleBtn = document.querySelector(
        '.player-controls button[data-tooltip*="ngẫu nhiên"]'
    );
    const repeatBtn = document.querySelector(
        '.player-controls button[data-tooltip*="lặp lại"]'
    );
    const prevBtn = document.querySelector(
        '.player-controls button[data-tooltip="Trước"]'
    );
    const nextBtn = document.querySelector(
        '.player-controls button[data-tooltip="Tiếp theo"]'
    );
    const progressContainer = document.querySelector(".progress-container");
    const progressBar = progressContainer.querySelector(".progress-bar");
    const progressFill = progressBar.querySelector(".progress-fill");
    const timeElements = progressContainer.querySelectorAll(".time");
    const currentTimeEl = timeElements[0];
    const durationEl = timeElements[1];

    if (
        !mainContent ||
        !homeView ||
        !artistView ||
        !logo ||
        !homeBtn ||
        !libraryContent ||
        !followBtn ||
        !createPlaylistBtn ||
        !imageUploader ||
        !heroImageWrapper ||
        !trackListContainer ||
        !playPauseBtn ||
        !prevBtn ||
        !nextBtn ||
        !shuffleBtn ||
        !repeatBtn ||
        !progressContainer ||
        !progressBar
    ) {
        return;
    }

    // --- Component Initialization ---
    const player = new Player({ trackListContainer });

    const contextMenuElement = document.getElementById("libraryContextMenu");
    if (contextMenuElement) {
        new ContextMenu({
            contextMenuElement,
            targetContainer: libraryContent,
            onPlaylistDeleted: (playlistId) => {
                //Nếu đang xem chi tiết playlist thì quay về home
                if (currentPlaylistForUpdate?.id === playlistId)
                    switchToHomeView();
            },
        });
    }

    // --- Event Listeners for Dynamic Content ---
    trackListContainer.addEventListener("click", (e) => {
        const likeBtn = e.target.closest(".track-like-btn");
        if (likeBtn) {
            handleLikeTrack(likeBtn);
        }
    });

    // --- State ---
    const trackDataMap = new Map();
    let currentArtistForFollowing = null;
    let currentPlaylistForUpdate = null;
    let isCurrentlyFollowing = false; // Trạng thái follow hiện tại của nghệ sĩ

    //Chuyển ẩn UI
    function switchToArtistView() {
        homeView.style.display = "none";
        artistView.style.display = "block";
        mainContent.scrollTop = 0; // Cuộn lên đầu khi chuyển view
    }

    function switchToHomeView() {
        artistView.style.display = "none";
        homeView.style.display = "block";
        mainContent.scrollTop = 0; // Cuộn lên đầu khi chuyển view
    }

    //Trở về Home
    logo.addEventListener("click", switchToHomeView);
    homeBtn.addEventListener("click", switchToHomeView);

    // Lắng nghe sự kiện cho việc điều hướng
    const handleNavigationClick = (e) => {
        // Thẻ nghệ sĩ trong nội dung chính
        const artistCard = e.target.closest(".artist-card");
        if (artistCard && artistCard.dataset.artistId) {
            showArtistDetail(artistCard.dataset.artistId);
            return;
        }

        // Thẻ album/playlist trong nội dung chính
        const playlistCard = e.target.closest(".hit-card");
        if (playlistCard && playlistCard.dataset.albumId) {
            showAlbumDetail(playlistCard.dataset.albumId);
            return;
        }

        // Mục trong thư viện (sidebar)
        const libraryItem = e.target.closest(".library-item");
        if (libraryItem) {
            const artistId = libraryItem.dataset.artistId;
            const playlistId = libraryItem.dataset.playlistId;
            const type = libraryItem.dataset.type;

            if (type === "liked-songs") {
                showLikedSongsDetail();
            } else if (artistId) {
                showArtistDetail(artistId);
            } else if (playlistId) {
                showPlaylistDetail(playlistId);
            }
        }
    };

    mainContent.addEventListener("click", handleNavigationClick);
    libraryContent.addEventListener("click", handleNavigationClick);

    // --- Playlist Cover Upload Logic ---
    heroImageWrapper.addEventListener("click", () => {
        // Chỉ cho phép upload khi đang xem playlist
        if (currentPlaylistForUpdate) {
            imageUploader.click();
        }
    });

    imageUploader.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file || !currentPlaylistForUpdate) return;

        const formData = new FormData();
        formData.append("cover", file); // API yêu cầu key là 'cover'

        try {
            // Bước 1: Tải file ảnh lên server.
            // Endpoint này sẽ lưu file và trả về URL của nó.
            const uploadResponse = await httpRequest.post(
                `upload/playlist/${currentPlaylistForUpdate.id}/cover`,
                formData
            );

            // Kiểm tra xem API có trả về URL hợp lệ không.
            if (!uploadResponse?.file?.url) {
                throw new Error("API không trả về URL ảnh hợp lệ.");
            }

            const serverOrigin = new URL(httpRequest.baseURL).origin;
            const newImageUrl = serverOrigin + uploadResponse.file.url;

            // Bước 2: Gửi yêu cầu PUT để cập nhật playlist với URL ảnh mới.
            const { playlist: updatedPlaylistData } = await httpRequest.put(
                `playlists/${currentPlaylistForUpdate.id}`,
                { image_url: newImageUrl }
            );

            // Cập nhật state cục bộ và giao diện với dữ liệu mới nhất
            currentPlaylistForUpdate = updatedPlaylistData;

            // Cập nhật ảnh bìa trên trang chi tiết (vẫn dùng newImageUrl vì nó là URL đầy đủ)
            const heroImage = artistView.querySelector(".hero-image");
            heroImage.src = newImageUrl;

            // Cập nhật ảnh trong thư viện sidebar
            const libraryItem = document.querySelector(
                `.library-item[data-playlist-id="${updatedPlaylistData.id}"]`
            );
            if (libraryItem) {
                const libraryImage = libraryItem.querySelector(".item-image");
                if (libraryImage) {
                    libraryImage.src = newImageUrl;
                }
            }

            showToast("Đã cập nhật ảnh bìa playlist!", "success");
        } catch (error) {
            console.error("Không thể cập nhật ảnh bìa:", error);
            showToast("Không thể cập nhật ảnh bìa. Vui lòng thử lại.", "error");
        } finally {
            // Reset input để có thể upload lại cùng một file
            e.target.value = "";
        }
    });

    // --- Create Playlist Logic ---
    createPlaylistBtn.addEventListener("click", async () => {
        //Vô hiệu hóa người dùng bấm liên tục nhiều lần
        createPlaylistBtn.disabled = true;

        try {
            const { playlist } = await httpRequest.post("playlists", {
                name: "My Playlist",
                // API sẽ tự động xử lý các tên trùng lặp (ví dụ: "My Playlist #2")
            });

            //Sử dụng hàm tạo UI
            const newPlaylistItem = createPlaylistLibraryItem(playlist);
            //Thêm playlist vào đầu danh sách Sidebar
            libraryContent.prepend(newPlaylistItem);
            //Hiển thị thông báo thành công
            showToast(`Đã tạo playlist "${playlist.name}"`, "success");

            //Cuộn đến Playlist mới để tối ưu trải nghiệm
            newPlaylistItem.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });

            // Hiển thị chi tiết playlist vừa tạo
            showPlaylistDetail(playlist.id);
        } catch (error) {
            console.error("Không thể tạo playlist:", error);
            showToast("Không thể tạo playlist. Vui lòng thử lại.", "error");
        } finally {
            //Kích hoạt lại nút sau khi thao tác hoàn tất
            createPlaylistBtn.disabled = false;
        }
    });

    async function showAlbumDetail(albumId) {
        try {
            const album = await httpRequest.get(`albums/${albumId}`);
            renderAlbumDetail(album);
            switchToArtistView();
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết album:", error);
            showToast("Không thể tải chi tiết album.", "error");
        }
    }

    //Lấy data để Show UI
    async function showArtistDetail(artistId) {
        try {
            // Bước 1: Lấy thông tin chi tiết của nghệ sĩ và kiểm tra trạng thái follow.
            const artist = await httpRequest.get(`artists/${artistId}`);
            currentArtistForFollowing = artist; // Lưu lại nghệ sĩ hiện tại

            // Kiểm tra xem người dùng đã "follow" nghệ sĩ này chưa
            // bằng cách tìm playlist tương ứng.
            await checkFollowStatus(artist);

            // Bước 2: Lấy danh sách bài hát phổ biến của nghệ sĩ.
            let artistTracks = [];
            try {
                const { tracks } = await httpRequest.get(
                    `artists/${artistId}/tracks/popular`
                );
                artistTracks = tracks || [];
            } catch (trackError) {
                console.error(
                    `Lỗi khi lấy danh sách bài hát cho nghệ sĩ ${artistId}:`,
                    trackError
                );
                // Vẫn tiếp tục render trang chi tiết nghệ sĩ dù không có bài hát
            }

            // Bước 3: Hiển thị dữ liệu đã lấy được
            renderArtistDetail(artist, artistTracks);
            switchToArtistView();
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết nghệ sĩ hoặc bài hát:", error);
        }
    }

    // --- Follow/Unfollow Logic ---

    // Kiểm tra trạng thái follow bằng cách gọi API
    async function checkFollowStatus(artist) {
        isCurrentlyFollowing = false; // Reset state
        updateFollowButton(false);

        try {
            // Lấy danh sách các nghệ sĩ mà người dùng đang theo dõi
            // Cung cấp giá trị mặc định là mảng rỗng để tránh lỗi khi API không trả về key 'artists'
            const { artists: followedArtists = [] } = await httpRequest.get(
                // API endpoint to get followed artists
                "me/following"
            );

            // Kiểm tra xem nghệ sĩ hiện tại có trong danh sách không
            const isFollowing = followedArtists.some((a) => a.id === artist.id);

            isCurrentlyFollowing = isFollowing;
            updateFollowButton(isFollowing);
        } catch (error) {
            console.error("Could not check follow status:", error);
            // Mặc định là không follow nếu có lỗi
            isCurrentlyFollowing = false;
            updateFollowButton(false);
        }
    }

    //Cập nhật UI nút Follow/Following
    function updateFollowButton(isFollowing) {
        followBtn.textContent = isFollowing ? "Following" : "Follow";
        followBtn.classList.toggle("active", isFollowing);
    }

    //Xử lý sự kiện click button
    followBtn.addEventListener("click", async () => {
        if (!currentArtistForFollowing) return;
        followBtn.disabled = true;

        try {
            let response;
            if (isCurrentlyFollowing) {
                // Unfollow: Gọi API DELETE
                response = await httpRequest.delete(
                    `artists/${currentArtistForFollowing.id}/follow`
                );
            } else {
                // Follow: Gọi API POST
                response = await httpRequest.post(
                    `artists/${currentArtistForFollowing.id}/follow`
                );
            }

            // Cập nhật trạng thái và UI
            if (response && typeof response.is_following !== "undefined") {
                isCurrentlyFollowing = response.is_following;
                updateFollowButton(isCurrentlyFollowing);
                showToast(response.message, "success");
            }
        } catch (error) {
            console.error("Lỗi khi thực hiện follow/unfollow:", error);
            const errorMessage =
                error.response?.error?.message ||
                "Có lỗi xảy ra, vui lòng thử lại.";
            showToast(errorMessage, "error");
        } finally {
            followBtn.disabled = false;
        }
    });

    async function showLikedSongsDetail() {
        try {
            // Call the API to get the user's liked tracks
            const { tracks, pagination } = await httpRequest.get(
                "me/tracks/liked?limit=20&offset=0"
            );
            renderLikedSongsDetail(tracks, pagination.total);
            switchToArtistView();
        } catch (error) {
            console.error("Lỗi khi lấy danh sách bài hát đã thích:", error);
            showToast("Không thể tải Bài hát đã thích.", "error");
        }
    }

    async function showPlaylistDetail(playlistId) {
        try {
            // Endpoint API là dành cho playlist, sử dụng albumId từ thẻ.
            const playlist = await httpRequest.get(`playlists/${playlistId}`);
            renderPlaylistDetail(playlist);
            switchToArtistView();
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết playlist:", error);
        }
    }

    function renderAlbumDetail(album) {
        const heroImage = artistView.querySelector(".hero-image");
        const heroTitle = artistView.querySelector(".artist-name");
        const heroSubtitle = artistView.querySelector(".monthly-listeners");
        const verifiedBadge = artistView.querySelector(".verified-badge");
        const trackList = artistView.querySelector(".track-list");

        const artistHero = artistView.querySelector(".artist-hero");
        artistHero.classList.add("is-playlist"); // Dùng class này để ảnh bìa vuông
        followBtn.style.display = "none";
        currentPlaylistForUpdate = null; // Đây là album, không cho phép cập nhật ảnh

        heroImage.src = album.cover_image_url || "placeholder.svg";
        heroImage.alt = `${album.title} cover`;
        heroTitle.textContent = album.title;
        heroSubtitle.textContent = album.artist_name
            ? `Album • ${album.artist_name}`
            : "Album";
        verifiedBadge.style.display = "none";

        // Hiển thị danh sách bài hát
        trackDataMap.clear();
        const tracks = album.tracks || [];
        tracks.forEach((track) => trackDataMap.set(track.id, track));
        player.loadNewQueue(tracks, trackDataMap);

        trackList.innerHTML = "";
        if (tracks.length > 0) {
            tracks.forEach((track, index) => {
                const trackElement = createTrackItemElement(track, index + 1);
                trackList.appendChild(trackElement);
            });
        } else {
            trackList.innerHTML =
                '<p class="empty-list-message">Album này không có bài hát nào.</p>';
        }
    }

    function renderArtistDetail(artist, tracks) {
        const heroImage = artistView.querySelector(".hero-image");
        const artistName = artistView.querySelector(".artist-name");
        const listeners = artistView.querySelector(".monthly-listeners");
        const verifiedBadge = artistView.querySelector(".verified-badge");
        const trackList = artistView.querySelector(".track-list");

        const artistHero = artistView.querySelector(".artist-hero");
        artistHero.classList.remove("is-playlist");
        followBtn.style.display = "inline-block";
        currentPlaylistForUpdate = null;

        heroImage.src = artist.background_image_url || "placeholder.svg";
        heroImage.alt = `${artist.name} background`;
        artistName.textContent = artist.name;
        listeners.textContent = `${artist.monthly_listeners.toLocaleString()} monthly listeners`;
        verifiedBadge.style.display = artist.is_verified ? "flex" : "none";

        // Hiển thị danh sách bài hát phổ biến
        trackDataMap.clear(); //Xóa dữ liệu bài hát cũ
        const tracksForPlayer = [];

        trackList.innerHTML = ""; // Xóa nội dung cũ
        if (tracks && tracks.length > 0) {
            tracks.forEach((track, index) => {
                trackDataMap.set(track.id, track);
                tracksForPlayer.push(track);

                const trackElement = createTrackItemElement(track, index + 1);
                trackList.appendChild(trackElement);
            });
        } else {
            trackList.innerHTML =
                '<p class="empty-list-message">Nghệ sĩ này chưa có bài hát nào.</p>';
        }
        // Load hàng đợi cho player SAU KHI đã tạo xong map và danh sách
        player.loadNewQueue(tracksForPlayer, trackDataMap);
    }

    function renderPlaylistDetail(playlist) {
        const heroImage = artistView.querySelector(".hero-image");
        const playlistName = artistView.querySelector(".artist-name");
        const description = artistView.querySelector(".monthly-listeners");
        const verifiedBadge = artistView.querySelector(".verified-badge");
        const trackList = artistView.querySelector(".track-list");

        const artistHero = artistView.querySelector(".artist-hero");
        artistHero.classList.add("is-playlist");
        followBtn.style.display = "none";
        currentPlaylistForUpdate = playlist;

        heroImage.src = playlist.image_url || "placeholder.svg"; // Sử dụng image_url từ API playlist
        heroImage.alt = `${playlist.name} cover`; // Sử dụng name từ API playlist
        playlistName.textContent = playlist.name;

        // Lấy tên người tạo playlist, ưu tiên display_name, nếu không có thì dùng username
        let ownerName = playlist.user_display_name || playlist.user_username;
        if (!ownerName) {
            const userEmail = document.getElementById("user-name")?.textContent;
            if (userEmail) {
                const emailUsername = userEmail.split("@")[0];
                ownerName = emailUsername.substring(0, 6);
            }
        }
        description.textContent =
            playlist.description ||
            (ownerName ? `By ${ownerName}` : "Playlist");
        verifiedBadge.style.display = "none"; // Playlist không có trạng thái "đã xác minh"

        //Hiển thị danh sách bài hát
        trackDataMap.clear();
        const tracks = playlist.tracks || [];
        tracks.forEach((track) => trackDataMap.set(track.id, track)); // Tạo map trước
        player.loadNewQueue(tracks, trackDataMap); // Load hàng đợi cho player

        trackList.innerHTML = "";
        if (tracks.length > 0) {
            tracks.forEach((track, index) => {
                const trackElement = createTrackItemElement(track, index + 1);
                trackList.appendChild(trackElement);
            });
        } else {
            trackList.innerHTML =
                '<p class="empty-list-message">Playlist này không có bài hát nào.</p>';
        }
    }

    function renderLikedSongsDetail(tracks, totalTracks) {
        const heroImage = artistView.querySelector(".hero-image");
        const playlistName = artistView.querySelector(".artist-name");
        const description = artistView.querySelector(".monthly-listeners");
        const verifiedBadge = artistView.querySelector(".verified-badge");
        const trackList = artistView.querySelector(".track-list");

        const artistHero = artistView.querySelector(".artist-hero");
        artistHero.classList.remove("is-playlist");
        followBtn.style.display = "none";
        currentPlaylistForUpdate = null;
        currentArtistForFollowing = null;

        // Sử dụng ảnh placeholder mặc định cho trang "Bài hát đã thích"
        heroImage.src = "placeholder.svg";
        heroImage.alt = "Bài hát đã thích";
        playlistName.textContent = "Bài hát đã thích";

        // Lấy tên người dùng hiện tại để hiển thị
        const currentUser = getCurrentUserFromStorage();

        const userName =
            currentUser?.display_name ||
            currentUser?.email?.split("@")[0] ||
            "Bạn";

        description.textContent = `${userName} • ${totalTracks} bài hát`;
        verifiedBadge.style.display = "none";

        // Render danh sách bài hát
        trackDataMap.clear();
        trackList.innerHTML = "";

        if (tracks && tracks.length > 0) {
            tracks.forEach((track, index) => {
                trackDataMap.set(track.id, track);
                const trackElement = createTrackItemElement(track, index + 1);
                trackList.appendChild(trackElement);
            });
        } else {
            trackList.innerHTML =
                '<p class="empty-list-message">Bạn chưa thích bài hát nào.</p>';
        }

        // Load hàng đợi mới vào player
        player.loadNewQueue(tracks, trackDataMap);
    }
    //Tạo Element
    function createTrackItemElement(track, index) {
        const item = document.createElement("div");
        item.className = "track-item";
        item.dataset.trackId = track.id; // Gán ID để xác định bài hát khi click

        const durationMin = Math.floor(track.duration / 60);
        const durationSec = (track.duration % 60).toString().padStart(2, "0");

        const imageUrl =
            track.album?.cover_image_url ||
            track.album_cover_image_url ||
            track.image_url || // Xử lý trường hợp URL ảnh nằm trực tiếp trên track
            "placeholder.svg";

        const isLiked = likedTracks.has(track.id);

        item.innerHTML = `
        <div class="track-number">${index}</div>
            <div class="track-image">
                <img src="${imageUrl}" alt="${track.title}">
            </div>
            <div class="track-info">
                <div class="track-name">${track.title}</div>
            </div>
            <div class="track-plays">${track.play_count.toLocaleString()}</div>
            <button
                class="track-like-btn has-tooltip ${isLiked ? "active" : ""}"
                data-track-id="${track.id}"
                data-tooltip="${
                    isLiked ? "Xóa khỏi Thư viện" : "Lưu vào Thư viện"
                }"
            ><i class="fas fa-heart"></i></button>
            <div class="track-duration">${durationMin}:${durationSec}</div>
            <button class="track-menu-btn"><i class="fas fa-ellipsis-h"></i></button>
       `;
        return item;
    }
});

import httpRequest from "./utils/httpRequest.js";

/**
    Show Toast Message Function
 */

function showToast(message, type = "success", duration = 3000) {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;

    const icons = {
        success: "fa-check-circle",
        error: "fa-times-circle",
        info: "fa-info-circle",
        warning: "fa-exclamation-circle",
    };

    toast.innerHTML = `
         <i class="fas ${icons[type]} toast__icon"></i>
        <span class="toast__message">${message}</span>
    `;

    toastContainer.appendChild(toast);
    //Thêm class "show" để hiện thị
    setTimeout(() => toast.classList.add("show"), 100);
    //Xóa toast sau khi hết thời gian
    setTimeout(() => {
        toast.classList.remove("show");
        //Xóa khỏi DOM khi animation kết thúc
        toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
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
                localStorage.setItem("currentUser", user);
                updateCurrentUser(user);
                showToast("Đăng ký thành công!", "success");
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
                localStorage.setItem("currentUser", user);

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

function updateCurrentUser(user) {
    const userName = document.querySelector("#user-name");
    const userAvatar = document.querySelector("#user-avatar");

    if (user.avatar_url) {
        userAvatar.src = user.avatar_url;
    }
    if (user.email) {
        userName.textContent = user.email;
    }
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

// Sort Dropdown Functionality

document.addEventListener("DOMContentLoaded", function () {
    const sortBtn = document.getElementById("sortBtn");
    const sortBtnText = document.getElementById("sortBtnText");
    const sortDropdown = document.getElementById("sortDropdown");
    const libraryContent = document.querySelector(".library-content");

    if (!sortBtn || !sortDropdown || !libraryContent) return;

    //"Recents" sort
    const initialLibraryItems = Array.from(libraryContent.children);

    //Toggle dropdown
    sortBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        sortDropdown.classList.toggle("show");
    });

    //Click to outside Close dropdown
    document.addEventListener("click", function (e) {
        if (!sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
            sortDropdown.classList.remove("show");
        }
    });

    //Escape Key Close dropdown
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && sortDropdown.classList.contains("show")) {
            sortDropdown.classList.remove("show");
        }
    });

    //Handle click sort Option
    sortDropdown.addEventListener("click", function (e) {
        const selectedItem = e.target.closest(".dropdown-item");

        if (!selectedItem) return;

        const sortType = selectedItem.dataset.sort;
        const selectedText = selectedItem.textContent.trim();

        //Update Text dropdown header
        if (sortBtnText) {
            sortBtnText.textContent = selectedText;
        }

        //Close dropdown when click Text
        sortDropdown.classList.remove("show");
        sortLibraryItems(sortType);
    });

    //Function Logic sortType
    function sortLibraryItems(sortType) {
        const items = Array.from(
            libraryContent.querySelectorAll(".library-item")
        );
        let sortItems;

        switch (sortType) {
            case "artists":
                sortItems = items.sort((a, b) => {
                    const aIsArtist = a
                        .querySelector(".item-subtitle")
                        .textContent.includes("Artist");
                    const bIsArtist = b
                        .querySelector(".item-subtitle")
                        .textContent.includes("Artist");

                    if (aIsArtist === bIsArtist) return 0;
                    return aIsArtist ? -1 : 1;
                });
                break;
            case "playlists":
                sortItems = items.sort((a, b) => {
                    const aIsPlaylist = a
                        .querySelector(".item-subtitle")
                        .textContent.includes("Playlist");
                    const bIsPlaylist = b
                        .querySelector(".item-subtitle")
                        .textContent.includes("Playlist");
                    if (aIsPlaylist === bIsPlaylist) return 0;
                    return aIsPlaylist ? -1 : 1;
                });
                break;
            case "recents":
            default:
                sortItems = initialLibraryItems;
                break;
        }

        libraryContent.innerHTML = "";
        sortItems.forEach((item) => libraryContent.appendChild(item));
    }
});

//Function sort with Tabs
document.addEventListener("DOMContentLoaded", function () {
    const navTabsContainer = document.querySelector(".nav-tabs");
    if (!navTabsContainer) return;
    navTabsContainer.addEventListener("click", function (e) {
        const clickedTab = e.target.closest(".nav-tab");
        if (!clickedTab) return;

        //Update active tabs
        navTabsContainer
            .querySelector(".nav-tab.active")
            .classList.remove("active");
        clickedTab.classList.add("active");

        //Filter on the data-attribute
        const filter = clickedTab.dataset.filter;
        filterLibraryItems(filter);
    });

    function filterLibraryItems(filter) {
        // Lấy danh sách các mục mỗi khi hàm được gọi
        // để đảm bảo các mục được thêm vào sau cũng được xử lý.
        const libraryItems = document.querySelectorAll(
            ".library-content .library-item"
        );
        libraryItems.forEach((item) => {
            let shouldShow = false;

            if (filter === "all") {
                shouldShow = true;
            } else if (filter === "playlists") {
                const subtitle = item
                    .querySelector(".item-subtitle")
                    ?.textContent.toLowerCase();
                // "Liked Songs" là một playlist đặc biệt
                if (
                    (subtitle && subtitle.includes("playlist")) ||
                    item.querySelector(".liked-songs")
                ) {
                    shouldShow = true;
                }
            } else if (filter === "artists") {
                const subtitle = item
                    .querySelector(".item-subtitle")
                    ?.textContent.toLowerCase();
                if (subtitle && subtitle.includes("artist")) {
                    shouldShow = true;
                }
            }

            //Style display
            item.style.display = shouldShow ? "flex" : "none";
        });
    }

    //Initially filter default active tab
    const initialActiveTab = navTabsContainer.querySelector(".nav-tab.active");
    if (initialActiveTab) {
        filterLibraryItems(initialActiveTab.dataset.filter);
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
    item.dataset.playlistId = playlist.id;

    const ownerName = playlist.user_display_name || playlist.user_username;

    item.innerHTML = `
        <img
            src="${playlist.image_url || "placeholder.svg?height=48&width=48"}"
            alt="${playlist.name}"
            class="item-image"
        />
        <div class="item-info">
            <div class="item-title">${playlist.name}</div>
            <div class="item-subtitle">Playlist • ${ownerName}</div>
        </div>
    `;
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
            httpRequest.get("playlists?limit=50"), // Giả sử endpoint này lấy playlist của user
        ]);

        artists?.forEach((artist) =>
            libraryContent.appendChild(createArtistLibraryItem(artist))
        );
        playlists?.forEach((playlist) =>
            libraryContent.appendChild(createPlaylistLibraryItem(playlist))
        );
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

//Tạo Element Today's biggest hits "hit-card"
function createBiggestHitCard(album) {
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

//Render ra danh sách Today's biggest hits "hit-card"
document.addEventListener("DOMContentLoaded", async () => {
    const hitsGrid = document.querySelector(".hits-grid");
    if (!hitsGrid) return;
    try {
        const { albums } = await httpRequest.get("albums/popular?limit=20");
        hitsGrid.innerHTML = "";

        albums.forEach((album) => {
            const hitCard = createBiggestHitCard(album);
            hitsGrid.appendChild(hitCard);
        });
    } catch (error) {
        console.error("Failed to load today's biggest hits:", error);
    }
});

//Context Menu
document.addEventListener("DOMContentLoaded", () => {
    const libraryContent = document.querySelector(".library-content");
    const contextMenu = document.getElementById("libraryContextMenu");

    if (!libraryContent || !contextMenu) return;
    let currentTargetItem = null;

    libraryContent.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        currentTargetItem = e.target.closest(".library-item");
        if (!currentTargetItem) return;

        //Check loại kiểu Album
        const subtitle =
            currentTargetItem.querySelector(".item-subtitle")?.textContent ||
            "";

        const isArtist = subtitle.includes("Artist");
        const isPlaylist =
            subtitle.includes("Playlist") ||
            currentTargetItem.querySelector(".liked-songs");

        //Loại cơ bản
        populateContextMenu(contextMenu, { isArtist, isPlaylist });

        //Định vị theo chuột mở ra Menu
        positionMenu(e, contextMenu);
        contextMenu.classList.add("show");
    });

    //Đóng Context menu
    function closeContextMenu() {
        contextMenu.classList.remove("show");
        currentTargetItem = null;
    }

    document.addEventListener("click", () => closeContextMenu());
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeContextMenu();
    });

    function populateContextMenu(menu, { isArtist, isPlaylist }) {
        menu.innerHTML = "";

        if (isArtist) {
            menu.innerHTML = `
                <div class="dropdown-item" data-action="unfollow">
                    <i class="fas fa-user-minus"></i>
                    <span>Unfollow</span>
                </div>
                `;
        } else if (isPlaylist) {
            menu.innerHTML = `
                <div class="dropdown-item" data-action="remove-from-profile">
                    <i class="fas fa-minus-circle"></i>
                    <span>Remove from profile</span>
                </div>
                <div class="dropdown-item" data-action="delete">
                    <i class="fas fa-trash"></i>
                    <span>Delete</span>
                </div>
            `;
        }
    }

    //Định vị menu theo chuột phải
    function positionMenu(e, menu) {
        const { clientX: mouseX, clientY: mouseY } = e;
        const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
        const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menu;

        const x =
            mouseX + menuWidth > windowWidth ? mouseX - menuWidth : mouseX;
        const y =
            mouseY + menuHeight > windowHeight ? mouseY - menuHeight : mouseY;

        menu.style.top = `${y}px`;
        menu.style.left = `${x}px`;
    }

    //Hàm xử lý Context Menu
    contextMenu.addEventListener("click", (e) => {
        const actionItem = e.target.closest("[data-action]");
        if (!actionItem) return;

        const action = actionItem.dataset.action;
        const itemName =
            currentTargetItem?.querySelector(".item-title")?.textContent;
        console.log(`Action: '${action}' on item: '${itemName}'`);
        // Xử lý logic sau
        closeContextMenu();
    });
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

    // --- Player State and Elements ---
    const audio = new Audio();
    const playerState = {
        currentQueue: [],
        originalQueue: [],
        currentTrackIndex: -1,
        isPlaying: false,
        currentTrack: null,
        isShuffled: false,
        repeatMode: "none", // 'none', 'all', 'one'
    };
    const trackDataMap = new Map();

    // Player UI elements
    const playerImage = document.querySelector(".player-image");
    const playerTitle = document.querySelector(".player-title");
    const playerArtist = document.querySelector(".player-artist");
    const trackListContainer = artistView.querySelector(".track-list");
    const playPauseIcon = playPauseBtn.querySelector("i");

    // --- State for other functionalities ---
    let currentArtistForFollowing = null;
    let currentPlaylistForUpdate = null;
    let currentFollowPlaylist = null;

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

    // --- Player Controls Event Listeners ---
    playPauseBtn.addEventListener("click", togglePlayPause);
    shuffleBtn.addEventListener("click", toggleShuffle);
    repeatBtn.addEventListener("click", toggleRepeat);
    prevBtn.addEventListener("click", playPrevious);
    nextBtn.addEventListener("click", playNext);
    audio.addEventListener("ended", handleTrackEnd);

    audio.addEventListener("play", () => {
        playerState.isPlaying = true;
        updatePlayPauseButton(true);
    });

    audio.addEventListener("pause", () => {
        playerState.isPlaying = false;
        updatePlayPauseButton(false);
    });

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", () => {
        durationEl.textContent = formatTime(audio.duration);
    });
    progressBar.addEventListener("click", seek);

    function togglePlayPause() {
        //Không làm gì nếu bài hát chưa tải xong
        if (!playerState.currentTrack) return;

        if (playerState.isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    }

    function handleTrackEnd() {
        if (playerState.repeatMode === "one") {
            audio.currentTime = 0;
            audio.play();
        } else {
            playNext();
        }
    }

    function toggleShuffle() {
        playerState.isShuffled = !playerState.isShuffled;
        shuffleBtn.classList.toggle("active", playerState.isShuffled);
        shuffleBtn.dataset.tooltip = playerState.isShuffled
            ? "Tắt phát ngẫu nhiên"
            : "Bật phát ngẫu nhiên";

        if (playerState.isShuffled) {
            const currentTrackId = playerState.currentTrack?.id;
            playerState.currentQueue = shuffleArray([
                ...playerState.originalQueue,
            ]);
            if (currentTrackId) {
                playerState.currentTrackIndex =
                    playerState.currentQueue.findIndex(
                        (t) => t.id === currentTrackId
                    );
            }
        } else {
            const currentTrackId = playerState.currentTrack?.id;
            playerState.currentQueue = playerState.originalQueue;

            if (currentTrackId) {
                playerState.currentTrackIndex =
                    playerState.currentQueue.findIndex(
                        (t) => t.id === currentTrackId
                    );
            }
        }
    }

    function toggleRepeat() {
        if (playerState.repeatMode === "none") {
            repeatBtn.classList.add("active");
            repeatBtn.dataset.tooltip = "Bật lặp lại";
        } else {
            repeatBtn.classList.add("active");
            repeatBtn.dataset.tooltip =
                playerState.repeatMode === "all"
                    ? "Bật lặp lại một bài"
                    : "Tắt lặp lại";
        }
    }

    function updateRepeatButton() {
        if (playerState.repeatMode === "none") {
            repeatBtn.classList.remove("active");
            repeatBtn.dataset.tooltip = "Bật lặp lại";
        } else {
            repeatBtn.classList.add("active");
            repeatBtn.dataset.tooltip =
                playerState.repeatMode === "all"
                    ? "Bật lặp lại một bài"
                    : "Tắt lặp lại";
        }
    }

    function playNext() {
        if (playerState.currentQueue.length === 0) return;

        const isLastTrack =
            playerState.currentTrackIndex ===
            playerState.currentQueue.length - 1;
        //Check trường hợp bài cuối và ko có Repeat Mode
        if (playerState.repeatMode === "none" && isLastTrack) {
            playerState.isPlaying = false;
            updatePlayPauseButton(false);
            audio.pause();
            audio.currentTime = 0;
            updateProgress();
            return;
        }

        playerState.currentTrackIndex =
            (playerState.currentTrackIndex + 1) %
            playerState.currentQueue.length;

        playerState.currentTrack =
            playerState.currentQueue[playerState.currentTrackIndex];
        loadAndPlayCurrentTrack();
    }

    function playPrevious() {
        if (playerState.currentQueue.length === 0) return;

        // Nếu bài hát đã phát hơn 3 giây, phát lại từ đầu. Nếu không, chuyển về bài trước.
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        // Chuyển đến bài hát trước đó, quay vòng nếu ở đầu danh sách
        playerState.currentTrackIndex =
            (playerState.currentTrackIndex -
                1 +
                playerState.currentQueue.length) %
            playerState.currentQueue.length;
        playerState.currentTrack =
            playerState.currentQueue[playerState.currentTrackIndex];
        loadAndPlayCurrentTrack();
    }

    function updateProgress() {
        if (audio.duration) {
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${progressPercent}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    }

    function seek(e) {
        const width = progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;

        if (duration) {
            audio.currentTime = (clickX / width) * duration;
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60)
            .toString()
            .padStart(2, "0");
        return `${minutes}:${remainingSeconds}`;
    }

    //Thuật toán phát ngẫu nhiên bài
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- End Player Controls ---

    // ---- Player Logic
    //Lắng nghe sự kiện click vào bài hát
    trackListContainer.addEventListener("click", (e) => {
        const trackItem = e.target.closest(".track-item");
        if (trackItem && trackItem.dataset.trackId) {
            const trackId = trackItem.dataset.trackId;
            playTrackById(trackId);
        }
    });

    function playTrackById(trackId) {
        const trackToPlay = trackDataMap.get(trackId);
        const trackIndex = playerState.currentQueue.findIndex(
            (t) => t.id === trackId
        );

        if (trackToPlay && trackIndex > -1) {
            playerState.currentTrack = trackToPlay;
            playerState.currentTrackIndex = trackIndex;
            loadAndPlayCurrentTrack();
        } else {
            console.error("Không tìm thấy bài hát trong hàng đợi:", trackId);
        }
    }

    function loadAndPlayCurrentTrack() {
        const track = playerState.currentTrack;
        if (!track) return;

        updatePlayerUI(track);
        durationEl.textContent = "0:00"; // Reset duration display
        audio.src = track.audio_url;
        audio.play().catch((e) => console.error("Lỗi khi phát nhạc:", e));
        updatePlayingTrackUI();
    }

    function updatePlayPauseButton(isPlaying) {
        if (isPlaying) {
            playPauseIcon.classList.replace("fa-play", "fa-pause");
            playPauseBtn.dataset.tooltip = "Tạm dừng";
        } else {
            playPauseIcon.classList.replace("fa-pause", "fa-play");
            playPauseBtn.dataset.tooltip = "Phát";
        }
    }

    function updatePlayerUI(track) {
        if (!track) return;
        playerImage.src =
            track.album?.cover_image_url ||
            track.image_url ||
            "placeholder.svg?height=56&width=56";
        playerTitle.textContent = track.title;
        playerArtist.textContent = track.artist_name;
    }

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
            showPlaylistDetail(playlistCard.dataset.albumId);
            return;
        }

        // Mục trong thư viện (sidebar)
        const libraryItem = e.target.closest(".library-item");
        if (libraryItem) {
            const artistId = libraryItem.dataset.artistId;
            const playlistId = libraryItem.dataset.playlistId;

            if (artistId) {
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
        formData.append("image", file); // API yêu cầu key là 'image'

        try {
            // API cập nhật playlist là PATCH /playlists/:id
            const { playlist: updatedPlaylist } = await httpRequest.patch(
                `playlists/${currentPlaylistForUpdate.id}`,
                formData
            );

            // Cập nhật ảnh bìa trên trang chi tiết
            const heroImage = artistView.querySelector(".hero-image");
            heroImage.src = updatedPlaylist.image_url;

            // Cập nhật ảnh trong thư viện sidebar
            const libraryItem = document.querySelector(
                `.library-item[data-playlist-id="${updatedPlaylist.id}"]`
            );
            if (libraryItem) {
                const libraryImage = libraryItem.querySelector(".item-image");
                libraryImage.src = updatedPlaylist.image_url;
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

    //Lấy data để Show UI
    async function showArtistDetail(artistId) {
        try {
            // Bước 1: Lấy thông tin chi tiết của nghệ sĩ và kiểm tra trạng thái follow.
            const artist = await httpRequest.get(`artists/${artistId}`);
            currentArtistForFollowing = artist; // Lưu lại nghệ sĩ hiện tại

            // Kiểm tra xem người dùng đã "follow" nghệ sĩ này chưa
            // bằng cách tìm playlist tương ứng.
            await checkFollowStatus(artist);

            // Bước 2: Lấy danh sách tất cả bài hát để lọc.
            // Tách riêng lệnh gọi này để sau này có sửa dễ dàng hơn.
            let artistTracks = [];
            try {
                const allTracksResponse = await httpRequest.get(
                    "tracks?limit=20&offset=0"
                );
                const allTracks = allTracksResponse?.tracks;

                if (Array.isArray(allTracks)) {
                    // Chọc vào toàn bộ danh sách bài hát theo artist_id ở phía client
                    artistTracks = allTracks.filter(
                        (track) => track.artist_id === artistId
                    );
                } else {
                    console.error(
                        "API không trả về danh sách bài hát hợp lệ. Phản hồi từ 'tracks' endpoint:",
                        allTracksResponse
                    );
                }
            } catch (trackError) {
                console.error(
                    "Lỗi khi gọi API lấy danh sách bài hát (tracks?limit=200):",
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

    // Kiểm tra trạng thái follow bằng cách tìm playlist đặc biệt
    async function checkFollowStatus(artist) {
        currentFollowPlaylist = null;
        updateFollowButton(false);

        try {
            const { playlists } = await httpRequest.get(
                "playlists?limit=20&offset=0"
            );
            const followPlaylistName = `[FOLLOW] ${artist.name}`;

            const foundPlaylist = playlists.find(
                (p) => p.name === followPlaylistName
            );
            if (foundPlaylist) {
                currentFollowPlaylist = foundPlaylist;
                updateFollowButton(true);
            }
        } catch (error) {
            console.error("Could not check follow status:", error);
        }
    }

    //Cập nhật UI nút Follow/Following
    function updateFollowButton(isFollowing) {
        if (isFollowing) {
            followBtn.textContent = "Following";
            followBtn.classList.add("active");
        } else {
            followBtn.textContent = "Follow";
            followBtn.classList.remove("active");
        }
    }

    //Xử lý sự kiện click button
    followBtn.addEventListener("click", async () => {
        if (!currentArtistForFollowing) return;
        followBtn.disabled = true;

        try {
            if (currentFollowPlaylist) {
                // Unfollow: xóa playlist
                await httpRequest.delete(
                    `playlists/${currentFollowPlaylist.id}`
                );
                showToast(`Đã bỏ theo dõi ${currentArtistForFollowing.name}`);
                updateFollowButton(false);
                currentFollowPlaylist = null;
            } else {
                // Follow: Tạo playlist mới
                const { playlist } = await httpRequest.post("playlists", {
                    name: `[FOLLOW] ${currentArtistForFollowing.name}`,
                    is_public: false,
                });
                showToast(
                    `Đã theo dõi ${currentArtistForFollowing.name}!`,
                    "success"
                );
                updateFollowButton(true);
                currentFollowPlaylist = playlist;
            }
        } catch (error) {
            showToast("Có lỗi xảy ra, vui lòng thử lại.", "error");
        } finally {
            followBtn.disabled = false;
        }
    });

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

    function renderArtistDetail(artist, tracks) {
        const heroImage = artistView.querySelector(".hero-image");
        const artistName = artistView.querySelector(".artist-name");
        const listeners = artistView.querySelector(".monthly-listeners");
        const verifiedBadge = artistView.querySelector(".verified-badge");
        const trackList = artistView.querySelector(".track-list");

        const artistHero = artistView.querySelector(".artist-hero");
        artistHero.classList.remove("is-playlist");
        currentPlaylistForUpdate = null;

        heroImage.src = artist.background_image_url || "placeholder.svg";
        heroImage.alt = `${artist.name} background`;
        artistName.textContent = artist.name;
        listeners.textContent = `${artist.monthly_listeners.toLocaleString()} monthly listeners`;
        verifiedBadge.style.display = artist.is_verified ? "flex" : "none";

        // Hiển thị danh sách bài hát phổ biến
        trackDataMap.clear(); //Xóa dữ liệu bài hát cũ
        playerState.originalQueue = tracks;
        if (playerState.isShuffled) {
            playerState.currentQueue = shuffleArray([
                ...playerState.originalQueue,
            ]);
        } else {
            playerState.currentQueue = playerState.originalQueue;
        }

        trackList.innerHTML = ""; // Xóa nội dung cũ
        if (tracks && tracks.length > 0) {
            tracks.forEach((track, index) => {
                // API track của nghệ sĩ có cấu trúc phẳng, cần tạo một đối tượng lồng nhau
                // để tương thích với hàm createTrackItemElement.
                const trackDataForElement = {
                    ...track,
                    album: {
                        cover_image_url: track.album_cover_image_url,
                    },
                };
                trackDataMap.set(track.id, trackDataForElement); // Lưu dữ liệu bài hát
                const trackElement = createTrackItemElement(
                    trackDataForElement,
                    index + 1
                );
                trackList.appendChild(trackElement);
            });
        } else {
            trackList.innerHTML =
                '<p class="empty-list-message">Nghệ sĩ này chưa có bài hát nào.</p>';
        }
    }

    function renderPlaylistDetail(playlist) {
        const heroImage = artistView.querySelector(".hero-image");
        const playlistName = artistView.querySelector(".artist-name");
        const description = artistView.querySelector(".monthly-listeners");
        const verifiedBadge = artistView.querySelector(".verified-badge");
        const trackList = artistView.querySelector(".track-list");

        const artistHero = artistView.querySelector(".artist-hero");
        artistHero.classList.add("is-playlist");
        currentPlaylistForUpdate = playlist;

        heroImage.src = playlist.image_url || "placeholder.svg"; // Sử dụng image_url từ API playlist
        heroImage.alt = `${playlist.name} cover`; // Sử dụng name từ API playlist
        playlistName.textContent = playlist.name;

        // Lấy tên người tạo playlist, ưu tiên display_name, nếu không có thì dùng username
        const ownerName = playlist.user_display_name || playlist.user_username;
        description.textContent = playlist.description || `By ${ownerName}`;
        verifiedBadge.style.display = "none"; // Playlist không có trạng thái "đã xác minh"

        //Hiển thị danh sách bài hát
        trackDataMap.clear();
        playerState.originalQueue = playlist.tracks || [];
        if (playerState.isShuffled) {
            playerState.currentQueue = shuffleArray([
                ...playerState.originalQueue,
            ]);
        } else {
            playerState.currentQueue = playerState.originalQueue;
        }

        trackList.innerHTML = "";
        if (playlist.tracks && playlist.tracks.length > 0) {
            playlist.tracks.forEach((track, index) => {
                trackDataMap.set(track.id, track);
                const trackElement = createTrackItemElement(track, index + 1);
                trackList.appendChild(trackElement);
            });
        } else {
            trackList.innerHTML =
                '<p class="empty-list-message">Playlist này không có bài hát nào.</p>';
        }
    }

    function updatePlayingTrackUI() {
        // Xóa class 'playing' khỏi tất cả các mục
        const allTrackItem = trackListContainer.querySelectorAll(".track-item");
        allTrackItem.forEach((item) => item.classList.remove("playing"));

        // Thêm class 'playing' vào bài hát hiện tại
        if (playerState.currentTrack) {
            const currentTrackItem = trackListContainer.querySelector(
                `.track-item[data-track-id="${playerState.currentTrack.id}"]`
            );
            if (currentTrackItem) {
                currentTrackItem.classList.add("playing");
            }
        }
    }

    //Tạo Element
    function createTrackItemElement(track, index) {
        const item = document.createElement("div");
        item.className = "track-item";
        item.dataset.trackId = track.id; // Gán ID để xác định bài hát khi click

        const durationMin = Math.floor(track.duration / 60);
        const durationSec = (track.duration % 60).toString().padStart(2, "0");

        item.innerHTML = `
        <div class="track-number">${index}</div>
            <div class="track-image">
                <img src="${track.album.cover_image_url}" alt="${track.title}">
            </div>
            <div class="track-info">
                <div class="track-name">${track.title}</div>
            </div>
            <div class="track-plays">${track.play_count.toLocaleString()}</div>
            <div class="track-duration">${durationMin}:${durationSec}</div>
            <button class="track-menu-btn"><i class="fas fa-ellipsis-h"></i></button>
       `;
        return item;
    }
});

export function showToast(message, type = "success", duration = 3000) {
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
    //Thêm class show hiển thị
    setTimeout(() => toast.classList.add("show"), 100);
    //Xóa toast sau khi hết thời gian
    setTimeout(() => {
        toast.classList.remove("show");
        //Xóa khỏi DOM khi animation kết thúc
        toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
}

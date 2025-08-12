//Function Clear Form Error Message
export function clearFormErrors(formElement) {
    formElement.querySelectorAll(".form-group.invalid").forEach((group) => {
        group.classList.remove("invalid");
        const errorMsg = group.querySelector(".error-message");
        if (errorMsg) {
            errorMsg.remove();
        }
    });
}

//Function Error Message Form
export function displayFormError(inputElement, message) {
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

//Function Visibility Password
export function setupPasswordVisibilityToggle(toggleBtn) {
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

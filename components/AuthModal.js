import httpRequest from "../utils/httpRequest.js";
import {
    clearFormErrors,
    displayFormError,
    setupPasswordVisibilityToggle,
} from "../utils/formUtils.js";

const template = document.createElement("template");
template.innerHTML = `
    <style>
        /* CSS được đóng gói hoàn toàn trong component */
        :host {
            display: none; /* Ẩn component theo mặc định */
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
        }
        :host(.show) {
            display: block; /* Hiện component khi có class 'show' */
        }
        .modal-overlay {
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .modal-container {
            background: #121212; /* Spotify dark color */
            padding: 2rem;
            border-radius: 8px;
            position: relative;
            width: 90%;
            max-width: 450px;
            color: white;
            box-shadow: 0 4px 60px rgba(0,0,0,.5);
        }
        .modal-close-btn {
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: #aaa;
            font-size: 2rem;
            cursor: pointer;
            line-height: 1;
        }
        .modal-close-btn:hover {
            color: white;
        }
        /* Import các style cho form, input, button... từ file css/components.css vào đây */
        /* Ví dụ: */
        h2 {
            text-align: center;
            margin-bottom: 1.5rem;
        }
        .auth-form-content {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .form-group {
            display: flex;
            flex-direction: column;
        }
        label {
            margin-bottom: 0.5rem;
            font-weight: bold;
        }
        .form-input {
            background-color: #333;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 0.8rem;
            color: white;
        }
        .form-group.invalid .form-input {
            border-color: #f15e6c;
        }
        .error-message {
            color: #f15e6c;
            font-size: 0.8rem;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .password-input-wrapper {
            position: relative;
        }
        .toggle-password-visibility {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #aaa;
            cursor: pointer;
        }
        button[type="submit"] {
            background-color: #1db954;
            color: white;
            border: none;
            padding: 1rem;
            border-radius: 500px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 1rem;
        }
        p {
            text-align: center;
            margin-top: 1.5rem;
        }
        p button {
            background: none;
            border: none;
            color: #1db954;
            cursor: pointer;
            text-decoration: underline;
        }
    </style>
    <div class="modal-overlay">
        <div class="modal-container">
            <button class="modal-close-btn">&times;</button>

            <div id="signupFormContainer">
                <h2>Sign Up</h2>
                <form class="auth-form-content">
                    <div class="form-group">
                        <label for="signupEmail">Email</label>
                        <input type="email" id="signupEmail" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="signupPassword">Password</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="signupPassword" class="form-input" required>
                            <button type="button" class="toggle-password-visibility">
                                <i class="fas fa-eye-slash"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit">Sign Up</button>
                </form>
                <p>Already have an account? <button id="showLogin">Log In</button></p>
            </div>

            <div id="loginFormContainer" style="display: none;">
                <h2>Log In</h2>
                <form class="auth-form-content">
                     <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                         <div class="password-input-wrapper">
                            <input type="password" id="loginPassword" class="form-input" required>
                            <button type="button" class="toggle-password-visibility">
                                <i class="fas fa-eye-slash"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit">Log In</button>
                </form>
                <p>Don't have an account? <button id="showSignup">Sign Up</button></p>
            </div>
        </div>
    </div>
`;

class AuthModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.signupFormContainer = this.shadowRoot.querySelector(
            "#signupFormContainer"
        );
        this.loginFormContainer = this.shadowRoot.querySelector(
            "#loginFormContainer"
        );
    }

    connectedCallback() {
        this.shadowRoot
            .querySelector(".modal-overlay")
            .addEventListener("click", (e) => {
                if (e.target === e.currentTarget) this.close();
            });
        this.shadowRoot
            .querySelector(".modal-close-btn")
            .addEventListener("click", () => this.close());
        this.shadowRoot
            .querySelector("#showLogin")
            .addEventListener("click", () => this._showLoginForm());
        this.shadowRoot
            .querySelector("#showSignup")
            .addEventListener("click", () => this._showSignupForm());

        this.shadowRoot
            .querySelectorAll(".toggle-password-visibility")
            .forEach(setupPasswordVisibilityToggle);

        this.signupFormContainer
            .querySelector("form")
            .addEventListener("submit", async (e) => {
                e.preventDefault();
                clearFormErrors(this.signupFormContainer);
                const emailInput =
                    this.shadowRoot.querySelector("#signupEmail");
                const passwordInput =
                    this.shadowRoot.querySelector("#signupPassword");
                const credentials = {
                    email: emailInput.value,
                    password: passwordInput.value,
                };

                try {
                    const { user, access_token } = await httpRequest.post(
                        "auth/register",
                        credentials
                    );
                    this._handleAuthSuccess(user, access_token);
                } catch (error) {
                    if (error.response?.error) {
                        const { code, message } = error.response.error;
                        if (code === "EMAIL_EXISTS")
                            displayFormError(emailInput, message);
                    }
                }
            });

        this.loginFormContainer
            .querySelector("form")
            .addEventListener("submit", async (e) => {
                e.preventDefault();
                clearFormErrors(this.loginFormContainer);
                const emailInput = this.shadowRoot.querySelector("#loginEmail");
                const passwordInput =
                    this.shadowRoot.querySelector("#loginPassword");
                const credentials = {
                    email: emailInput.value,
                    password: passwordInput.value,
                };

                try {
                    const { user, access_token } = await httpRequest.post(
                        "auth/login",
                        credentials
                    );
                    this._handleAuthSuccess(user, access_token);
                } catch (error) {
                    if (error.response?.error) {
                        const { code, message } = error.response.error;
                        if (code === "INVALID_CREDENTIALS")
                            displayFormError(passwordInput, message);
                    }
                }
            });
    }

    _handleAuthSuccess(user, accessToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("currentUser", JSON.stringify(user));

        const event = new CustomEvent("auth-success", {
            bubbles: true,
            composed: true,
            detail: { user },
        });
        this.dispatchEvent(event);
    }

    _showSignupForm() {
        this.signupFormContainer.style.display = "block";
        this.loginFormContainer.style.display = "none";
    }

    _showLoginForm() {
        this.signupFormContainer.style.display = "none";
        this.loginFormContainer.style.display = "block";
    }

    open(formToShow = "signup") {
        this.classList.add("show");
        document.body.style.overflow = "hidden";
        formToShow === "login" ? this._showLoginForm() : this._showSignupForm();
    }

    close() {
        this.classList.remove("show");
        document.body.style.overflow = "auto";
        clearFormErrors(this.signupFormContainer);
        clearFormErrors(this.loginFormContainer);
    }
}

customElements.define("auth-modal", AuthModal);

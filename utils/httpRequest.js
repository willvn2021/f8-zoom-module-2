class HttpRequest {
    constructor() {
        this.baseURL = "https://spotify.f8team.dev/api/";
    }

    async _send(path, method, data, options = {}) {
        try {
            const _options = {
                ...options,
                method,
                headers: {
                    ...options.headers,
                },
            };

            if (data) {
                if (data instanceof FormData) {
                    // Để trình duyệt tự đặt Content-Type cho multipart/form-data
                    _options.body = data;
                } else {
                    _options.headers["Content-Type"] = "application/json";
                    _options.body = JSON.stringify(data);
                }
            }

            const accessToken = localStorage.getItem("accessToken");
            if (accessToken) {
                _options.headers.Authorization = `Bearer ${accessToken}`;
            }

            const res = await fetch(`${this.baseURL}${path}`, _options);
            const response = await res.json();

            if (!res.ok) {
                const error = new Error(`HTTP Error:`, res.status);
                error.response = response;
                error.status = res.status;
                throw error;
            }

            return response;
        } catch (error) {
            // console.error("HttpRequest Error:", error);
            throw error;
        }
    }

    async get(path, options) {
        return await this._send(path, "GET", null, options);
    }

    async post(path, data, options) {
        return await this._send(path, "POST", data, options);
    }

    async put(path, data, options) {
        return await this._send(path, "PUT", data, options);
    }

    async patch(path, data, options) {
        return await this._send(path, "PATCH", data, options);
    }

    async delete(path, options) {
        return await this._send(path, "DELETE", null, options);
    }
}

const httpRequest = new HttpRequest();

export default httpRequest;

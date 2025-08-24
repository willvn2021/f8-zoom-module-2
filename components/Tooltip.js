export default class Tooltip {
    constructor() {
        this.tooltipEl = null;
        this.showTimeout = null;
        //Đảm bảo DOM đã load trước khi khởi tạo
        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                this._init.bind(this)
            );
        } else {
            this._init();
        }
    }

    _init() {
        //Tạo phần tử Tooltip và thêm vào body
        this.tooltipEl = document.createElement("div");
        this.tooltipEl.className = "spotify-tooltip";
        document.body.appendChild(this.tooltipEl);

        //Sử dụng event
        document.body.addEventListener(
            "mouseover",
            this.__handleMouseOver.bind(this)
        );
        document.body.addEventListener(
            "mouseout",
            this.__handleMouseOut.bind(this)
        );
    }

    __handleMouseOver(e) {
        const trigger = e.target.closest(".has-tooltip");
        if (!trigger) return;

        const tooltipText = trigger.dataset.tooltip;
        if (!tooltipText) return;

        this.tooltipEl.textContent = tooltipText;

        const triggerRect = trigger.getBoundingClientRect();
        const top = triggerRect.top;
        const left = triggerRect.left + triggerRect.width / 2; //tính toán hiển thị tooltip

        this.tooltipEl.style.top = `${top}px`;
        this.tooltipEl.style.left = `${left}px`;

        this.showTimeout = setTimeout(() => {
            this.tooltipEl.classList.add("show");
        }, 150);
    }

    __handleMouseOut() {
        clearTimeout(this.showTimeout);
        this.tooltipEl.classList.remove("show");
    }
}

// theme toggle
const themeToggleBtn = document.querySelector('.theme-toggle');
const currentTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "dark") {
        themeToggleBtn.innerHTML = '<img src="https://raw.githubusercontent.com/joelmohh/joelmohh/refs/heads/main/img/moon.svg" alt="">';
    } else {
        themeToggleBtn.innerHTML = '<img src="https://raw.githubusercontent.com/joelmohh/joelmohh/refs/heads/main/img/sun.svg" alt="">';
    }
}

themeToggleBtn.addEventListener('click', function () {
    let theme = document.documentElement.getAttribute("data-theme");
    if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        themeToggleBtn.innerHTML = '<img src="https://raw.githubusercontent.com/joelmohh/joelmohh/refs/heads/main/img/moon.svg" alt="">';
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
        themeToggleBtn.innerHTML = '<img src="https://raw.githubusercontent.com/joelmohh/joelmohh/refs/heads/main/img/sun.svg" alt="">';
    }
});

// Uptime bars
document.querySelectorAll('.service-card').forEach(card => {
    const name = card.getAttribute('data-service');
    const description = card.getAttribute('data-description') || 'No description available.';

    card.innerHTML = `
        <div class="service-header">
            <h3>${name}</h3>
            <span class="badge online">Operational</span>
        </div>
        <p class="service-desc">${description}</p>
        <div class="uptime-wrapper">
            <div class="uptime-bar"></div>
            <div class="uptime-footer">
                <span>90 days ago</span>
                <span>100% uptime</span>
                <span>Today</span>
            </div>
        </div>
    `;

    const barContainer = card.querySelector('.uptime-bar');
    for (let i = 0; i < 60; i++) {
        const segment = document.createElement('span');
        segment.className = 'segment';

        if (Math.random() > 0.98) {
            segment.classList.add('down');
        }

        barContainer.appendChild(segment);
    }
});

document.querySelectorAll('.ls').forEach(el => {
    const words = el.textContent.trim().split(" ");
    const last = words.pop();
    el.innerHTML = words.join(" ") + ' <span class="online">' + last + '</span>';
});


document.querySelectorAll('.service-cardS').forEach(card => {

    card.innerHTML = `
        <div class="uptime-wrapper">
            <div class="uptime-bar"></div>
            <div class="uptime-footer">
                <span>90 days ago</span>
                <span>100% uptime</span>
                <span>Today</span>
            </div>
        </div>
    `;

    const barContainer = card.querySelector('.uptime-bar');
    for (let i = 0; i < 60; i++) {
        const segment = document.createElement('span');
        segment.className = 'segment';

        if (Math.random() > 0.98) {
            segment.classList.add('down');
        }

        barContainer.appendChild(segment);
    }
});
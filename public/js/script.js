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
    const descprition = card.getAttribute('data-description') || 'No description available.';
    card.innerHTML = `
                <div class="service-header">
                    <h3>${name}</h3>
                    <span class="badge online">Operational</span>
                </div>
                <p class="service-desc">${descprition}</p>
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
    for (let i = 0; i < 100; i++) {
        const segment = document.createElement('span');
        segment.className = 'segment';
        barContainer.appendChild(segment);
    }
});

// menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navContainer = document.querySelector('.nav-container');
const navLinks = document.querySelectorAll('.links a');
const navClose = document.querySelector('.nav-close');

if (menuToggle && navContainer) {
    const closeNav = () => {
        navContainer.classList.remove('active');
        menuToggle.classList.remove('open');
        document.body.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
    };

    menuToggle.addEventListener('click', () => {
        const isOpen = navContainer.classList.toggle('active');
        menuToggle.classList.toggle('open', isOpen);
        document.body.classList.toggle('nav-open', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.forEach(link => link.addEventListener('click', closeNav));

    if (navClose) {
        navClose.addEventListener('click', closeNav);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNav();
        }
    });
}
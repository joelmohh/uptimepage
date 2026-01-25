// ===================
// THEME TOGGLE
// ===================
const themeToggleBtn = document.querySelector('.theme-toggle');

if (themeToggleBtn) {
    const currentTheme =
        localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    themeToggleBtn.innerHTML =
        theme === 'dark'
            ? '<img src="https://raw.githubusercontent.com/joelmohh/joelmohh/refs/heads/main/img/moon.svg" alt="Dark">'
            : '<img src="https://raw.githubusercontent.com/joelmohh/joelmohh/refs/heads/main/img/sun.svg" alt="Light">';
}


// ===================
// UPTIME BARS (COM DADOS)
// ===================
document.querySelectorAll('.service-card').forEach(card => {
    const name = card.dataset.service;
    const description = card.dataset.description || 'No description available.';
    const last90Days = card.getAttribute('last90days') || '';
    const uptime = card.getAttribute('uptime') || '0';
    const id = card.getAttribute('projectID') || '#';

    card.innerHTML = `
        <div class="service-header">
            <h3><a href="/${id}">${name}</a></h3>
            <span class="badge online">Operational</span>
        </div>
        <p class="service-desc">${description}</p>
        <div class="uptime-wrapper">
            <div class="uptime-bar"></div>
            <div class="uptime-footer">
                <span>90 days ago</span>
                <span>${uptime}% uptime</span>
                <span>Today</span>
            </div>
        </div>
    `;

    const barContainer = card.querySelector('.uptime-bar');

    for (let i = 0; i < 60; i++) {
        const segment = document.createElement('span');
        segment.classList.add('segment');

        if (!last90Days || last90Days.length < 60) {
            segment.classList.add('none');
        } else if (last90Days.charAt(i) === '0') {
            segment.classList.add('down');
        }

        barContainer.appendChild(segment);
    }
});


// ===================
// DESTACAR ÚLTIMA PALAVRA
// ===================
document.querySelectorAll('.ls').forEach(el => {
    const words = el.textContent.trim().split(' ');
    const last = words.pop();
    el.innerHTML = `${words.join(' ')} <span class="online">${last}</span>`;
});


// ===================
// UPTIME ALEATÓRIO
// ===================
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
        segment.classList.add('segment');

        if (Math.random() > 0.98) {
            segment.classList.add('down');
        }

        barContainer.appendChild(segment);
    }
});

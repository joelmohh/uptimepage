// theme toggle
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


// UPTIME BARS
document.querySelectorAll('.service-card').forEach(card => {
    const name = card.dataset.service;
    const description = card.dataset.description || 'No description available.';
    const history = card.dataset.history || '';
    const uptime = card.dataset.uptime || '0';
    const id = card.getAttribute('projectID') || '#';
    const status = card.dataset.status === 'down' ? 'down' : 'up';

    const badgeClass = status === 'up' ? 'online' : 'degraded';
    const badgeText = status === 'up' ? 'Operational' : 'Degraded';

    card.innerHTML = `
        <div class="service-header">
            <h3><a href="/${id}">${name}</a></h3>
            <span class="badge ${badgeClass}">${badgeText}</span>
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

    const segments = history || ''.padEnd(60, '-');
    const totalSegments = Math.max(segments.length, 60);

    for (let i = 0; i < totalSegments; i++) {
        const segment = document.createElement('span');
        segment.classList.add('segment');

        const value = segments.charAt(i) || '-';

        if (value === '-') {
            segment.classList.add('none');
        } else if (value === '0') {
            segment.classList.add('down');
        }

        barContainer.appendChild(segment);
    }
});

document.querySelectorAll('.ls').forEach(el => {
    const words = el.textContent.trim().split(' ');
    const last = words.pop();
    el.innerHTML = `${words.join(' ')} <span class="${last.toLowerCase()}">${last}</span>`;
});

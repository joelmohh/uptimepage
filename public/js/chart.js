const canvas = document.getElementById('responseTimeChart');
if (!canvas) {
    return;
}

const ctx = canvas.getContext('2d');

const fallback = () => {
    const labels = [];
    const data = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));
        data.push(Math.floor(Math.random() * 120) + 80);
    }
    return { labels, data };
};

const series = (window.responseChart && window.responseChart.labels && window.responseChart.labels.length)
    ? window.responseChart
    : fallback();

const labels = series.labels;
const data = series.data;

// Get CSS variables for theme colors
const computedStyle = getComputedStyle(document.documentElement);
const accentColor = computedStyle.getPropertyValue('--my-accent').trim();
const textColor = computedStyle.getPropertyValue('--my-text-color').trim();
const mutedColor = computedStyle.getPropertyValue('--my-muted-text').trim();
const cardBg = computedStyle.getPropertyValue('--my-card-bg').trim();

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'Response Time (ms)',
            data: data,
            borderColor: accentColor,
            backgroundColor: accentColor + '20',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: accentColor,
            pointHoverBorderColor: textColor,
            pointHoverBorderWidth: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 3,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: cardBg,
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: accentColor,
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return 'Response Time: ' + context.parsed.y + 'ms';
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: mutedColor,
                    maxTicksLimit: 12,
                    maxRotation: 0,
                    autoSkip: true
                }
            },
            y: {
                beginAtZero: false,
                grid: {
                    color: accentColor + '20',
                    drawBorder: false
                },
                ticks: {
                    color: mutedColor,
                    callback: function (value) {
                        return value + 'ms';
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    }
});

const observer = new MutationObserver(() => {
    const newStyle = getComputedStyle(document.documentElement);
    const newAccent = newStyle.getPropertyValue('--my-accent').trim();
    const newText = newStyle.getPropertyValue('--my-text-color').trim();
    const newMuted = newStyle.getPropertyValue('--my-muted-text').trim();
    const newCardBg = newStyle.getPropertyValue('--my-card-bg').trim();

    chart.data.datasets[0].borderColor = newAccent;
    chart.data.datasets[0].backgroundColor = newAccent + '20';
    chart.data.datasets[0].pointHoverBackgroundColor = newAccent;
    chart.data.datasets[0].pointHoverBorderColor = newText;

    chart.options.scales.x.ticks.color = newMuted;
    chart.options.scales.y.ticks.color = newMuted;
    chart.options.scales.y.grid.color = newAccent + '20';
    chart.options.plugins.tooltip.backgroundColor = newCardBg;
    chart.options.plugins.tooltip.titleColor = newText;
    chart.options.plugins.tooltip.bodyColor = newText;
    chart.options.plugins.tooltip.borderColor = newAccent;

    chart.update();
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});
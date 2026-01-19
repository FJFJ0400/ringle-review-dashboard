/**
 * 링글 리뷰 분석 대시보드 - 차트 모듈
 * Chart.js를 사용한 차트 초기화 및 관리
 */

/**
 * 트렌드 차트 초기화
 * @param {string} canvasId - 캔버스 요소 ID
 * @param {Object} data - 차트 데이터 (labels, positive, negative, neutral)
 * @returns {Chart} Chart.js 인스턴스
 */
function initTrendChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // 데이터가 없으면 빈 배열 사용
    const chartData = data || { labels: [], positive: [], negative: [], neutral: [] };

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: '긍정 리뷰',
                data: chartData.positive,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: '부정 리뷰',
                data: chartData.negative,
                borderColor: '#f44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: '중립 리뷰',
                data: chartData.neutral,
                borderColor: '#9e9e9e',
                backgroundColor: 'rgba(158, 158, 158, 0.1)',
                fill: true,
                tension: 0.4,
                hidden: true // 기본적으로 숨김
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

/**
 * 감성 분석 도넛 차트 초기화
 * @param {string} canvasId - 캔버스 요소 ID
 * @param {Object} data - 차트 데이터 (positive, negative, neutral)
 * @returns {Chart} Chart.js 인스턴스
 */
function initSentimentChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    const chartData = data || { positive: 0, negative: 0, neutral: 0 };

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['긍정', '부정', '중립'],
            datasets: [{
                data: [chartData.positive, chartData.negative, chartData.neutral],
                backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

/**
 * 차트 데이터 업데이트
 * @param {Chart} chart - Chart.js 인스턴스
 * @param {Object} newData - 새로운 데이터
 */
function updateChart(chart, newData) {
    if (!chart) return;

    if (chart.config.type === 'line') {
        chart.data.labels = newData.labels;
        chart.data.datasets[0].data = newData.positive;
        chart.data.datasets[1].data = newData.negative;
        if (chart.data.datasets[2]) {
            chart.data.datasets[2].data = newData.neutral;
        }
    } else if (chart.config.type === 'doughnut') {
        chart.data.datasets[0].data = [newData.positive, newData.negative, newData.neutral];
    }

    chart.update();
}

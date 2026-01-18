/**
 * 링글 리뷰 분석 대시보드 - 차트 모듈
 * Chart.js를 사용한 차트 초기화 및 관리
 */

/**
 * 트렌드 차트 초기화
 * @param {string} canvasId - 캔버스 요소 ID
 * @returns {Chart} Chart.js 인스턴스
 */
function initTrendChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2021 상', '2021 하', '2022 상', '2022 하', '2023 상', '2023 하', '2024 상', '2024 하', '2025 상'],
            datasets: [{
                label: '긍정 리뷰',
                data: [15, 22, 28, 35, 42, 48, 55, 62, 70],
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: '부정 리뷰',
                data: [8, 10, 12, 15, 18, 22, 25, 28, 30],
                borderColor: '#f44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * 감성 분석 도넛 차트 초기화
 * @param {string} canvasId - 캔버스 요소 ID
 * @returns {Chart} Chart.js 인스턴스
 */
function initSentimentChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['긍정', '부정', '중립'],
            datasets: [{
                data: [65, 25, 10],
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

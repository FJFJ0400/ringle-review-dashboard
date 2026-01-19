/**
 * 링글 리뷰 분석 대시보드 - 메인 스크립트
 * DOM 조작 및 이벤트 핸들러
 */

// 차트 인스턴스 저장
let trendChart = null;
let sentimentChart = null;

// 데이터 경로 설정 (GitHub Pages 배포 기준)
const DATA_BASE_URL = 'data/aggregated';
const MOCK_DATA_MODE = false; // 데이터 파일이 없을 때 mock data 사용 여부

// 기본 데이터 (데이터 로드 실패 시 또는 초기화용)
const reviewData = [
    { year: '2024', half: 'h1', source: 'AppStore', category: 'UI/UX', content: '샘플 리뷰입니다.', sentiment: 'positive' }
];

// 헬퍼 함수: 라벨 변환
function getSourceLabel(source) { return source; }
function getSentimentLabel(sentiment) {
    const map = { positive: '긍정', neutral: '중립', negative: '부정' };
    return map[sentiment] || sentiment;
}

/**
 * 테이블 렌더링
 * @param {Array} data - 렌더링할 리뷰 데이터 배열
 */
function renderTable(data) {
    const tbody = document.getElementById('reviewTableBody');
    if (!tbody) return;

    tbody.innerHTML = data.map(review => `
        <tr>
            <td>${review.year}년 ${review.half === 'h1' ? '상반기' : '하반기'}</td>
            <td><span class="source-badge">${getSourceLabel(review.source)}</span></td>
            <td>${review.category}</td>
            <td>${review.content}</td>
            <td><span class="sentiment-badge sentiment-${review.sentiment}">${getSentimentLabel(review.sentiment)}</span></td>
        </tr>
    `).join('');
}

/**
 * 리뷰 데이터 필터링 로직 (공통 사용)
 */
function filterReviewData(filters) {
    return reviewData.filter(item => {
        if (filters.year !== 'all' && item.year !== filters.year) return false;
        // half 필터가 있다면 체크 (HTML에는 없지만 로직 유지)
        if (filters.half && filters.half !== 'all' && item.half !== filters.half) return false;
        if (filters.sentiment !== 'all' && item.sentiment !== filters.sentiment) return false;
        if (filters.source !== 'all' && item.source !== filters.source) return false;
        return true;
    });
}

/**
 * 리뷰 필터링 및 테이블 업데이트
 */
function filterReviews() {
    const filters = {
        year: document.getElementById('yearFilter')?.value || 'all',
        half: document.getElementById('halfFilter')?.value || 'all',
        sentiment: document.getElementById('sentimentFilter')?.value || 'all',
        source: document.getElementById('sourceFilter')?.value || 'all'
    };

    const filtered = filterReviewData(filters);
    renderTable(filtered);
}

/**
 * CSV 내보내기
 */
function exportToCSV() {
    const filters = {
        year: document.getElementById('yearFilter')?.value || 'all',
        half: document.getElementById('halfFilter')?.value || 'all',
        sentiment: document.getElementById('sentimentFilter')?.value || 'all',
        source: document.getElementById('sourceFilter')?.value || 'all'
    };
    
    const data = filterReviewData(filters);
    
    if (data.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }

    // CSV 헤더 및 데이터 생성
    const headers = ['Year', 'Half', 'Source', 'Category', 'Content', 'Sentiment'];
    const csvRows = [headers.join(',')];

    data.forEach(row => {
        const values = [
            row.year,
            row.half,
            row.source,
            row.category,
            `"${(row.content || '').replace(/"/g, '""')}"`, // 따옴표 이스케이프 처리
            row.sentiment
        ];
        csvRows.push(values.join(','));
    });

    // BOM 추가 (엑셀 한글 깨짐 방지) 및 다운로드 트리거
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ringle_reviews_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 연도별 필터 탭 클릭 핸들러
 * @param {string} year - 선택된 연도
 */
function filterByYear(year) {
    // 탭 활성화 상태 업데이트
    document.querySelectorAll('.timeline-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // 연도 필터 업데이트
    const yearFilter = document.getElementById('yearFilter');
    if (yearFilter) {
        yearFilter.value = year === 'all' ? 'all' : year;
    }

    filterReviews();
}

/**
 * 대시보드 데이터 로드 및 UI 업데이트
 */
async function loadDashboardData() {
    try {
        // 1. 통계 데이터 로드 (stats.json)
        const statsResponse = await fetch(`${DATA_BASE_URL}/stats.json`);
        if (!statsResponse.ok) throw new Error('Stats data not found');
        const stats = await statsResponse.json();
        updateKPIs(stats);
        updateSentimentChart(stats);
        renderWordCloud(stats);

        // 2. 트렌드 데이터 로드 (trends.json)
        const trendsResponse = await fetch(`${DATA_BASE_URL}/trends.json`);
        if (!trendsResponse.ok) throw new Error('Trends data not found');
        const trends = await trendsResponse.json();
        updateTrendChartUI(trends);

        // 3. 이슈 데이터 로드 (top-issues.json)
        const issuesResponse = await fetch(`${DATA_BASE_URL}/top-issues.json`);
        if (issuesResponse.ok) {
            const issuesData = await issuesResponse.json();
            updateTopIssues(issuesData);
            updateChurnAlerts(issuesData);
        }
        
    } catch (error) {
        console.warn('데이터 로드 실패, 기본 데이터를 사용합니다:', error);
        // 데이터 로드 실패 시 차트 초기화 (빈 상태 또는 기본값)
        if (!trendChart) trendChart = initTrendChart('trendChart');
        if (!sentimentChart) sentimentChart = initSentimentChart('sentimentChart');
    }
}

/**
 * KPI 카드 업데이트
 * @param {Object} stats - stats.json 데이터
 */
function updateKPIs(stats) {
    // HTML 구조에 의존하여 순서대로 업데이트 (ID가 없는 경우)
    const statValues = document.querySelectorAll('.stat-value');
    
    if (statValues.length >= 1 && stats.ringle) {
        // 평균 평점
        statValues[0].textContent = stats.ringle.average_rating || '-';
        // 총 리뷰 수
        if (statValues[1]) statValues[1].textContent = stats.ringle.total || '-';
    }
    
    // 추가 KPI가 있다면 여기서 매핑
    // 예: 총 리뷰 수, 긍정 비율 등
}

/**
 * 주요 이슈 섹션 업데이트
 * @param {Object} data - top-issues.json 데이터
 */
function updateTopIssues(data) {
    const container = document.getElementById('topIssuesList');
    if (!container || !data.issues) return;

    container.innerHTML = data.issues.slice(0, 4).map(issue => `
        <div class="col-md-3">
            <div class="card h-100 border-light bg-light">
                <div class="card-body">
                    <h6 class="card-title text-danger d-flex justify-content-between align-items-center">
                        ${issue.problem_type}
                        <span class="badge bg-danger rounded-pill">${issue.count}건</span>
                    </h6>
                    <p class="card-text small text-muted mt-2">${issue.summary || '관련된 부정 리뷰가 감지되었습니다.'}</p>
                    <small class="text-secondary">심각도: ${Math.abs(issue.sentiment_score || 0).toFixed(1)}</small>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 이탈 위험 알림 섹션 업데이트
 * @param {Object} data - top-issues.json 데이터
 */
function updateChurnAlerts(data) {
    const section = document.getElementById('churnAlertSection');
    const container = document.getElementById('churnAlertContent');
    
    // 데이터 구조 호환성 체크 (Mock vs Aggregated)
    // aggregator.py는 data.ringle.churn_alerts, main.py(mock)는 data.churn_alerts 구조일 수 있음
    const alerts = data.ringle?.churn_alerts || data.churn_alerts || [];
    
    if (!section || !container || alerts.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }

    section.style.display = 'flex';
    container.innerHTML = alerts.map(alert => `
        <div class="alert alert-light border-danger mb-2">
            <strong>'${alert.keyword}'</strong> 관련 이탈 징후가 <strong>${alert.count}건</strong> 감지되었습니다.
            <div class="small text-muted mt-1">예시: "${alert.recent_examples?.[0]?.text?.substring(0, 80) || ''}..."</div>
        </div>
    `).join('');
}

/**
 * 트렌드 차트 UI 업데이트
 * @param {Object} trends - trends.json 데이터
 */
function updateTrendChartUI(trends) {
    if (!trends.daily || trends.daily.length === 0) return;

    const labels = trends.daily.map(d => d.date);
    const positiveData = trends.daily.map(d => d.ringle.sentiment.positive);
    const negativeData = trends.daily.map(d => d.ringle.sentiment.negative);
    const neutralData = trends.daily.map(d => d.ringle.sentiment.neutral);

    const chartData = {
        labels: labels,
        positive: positiveData,
        negative: negativeData,
        neutral: neutralData
    };

    if (trendChart) {
        updateChart(trendChart, chartData);
    } else {
        trendChart = initTrendChart('trendChart', chartData);
    }
}

// 차트 초기화 및 업데이트 헬퍼 함수들
function initTrendChart(canvasId, data = { labels: [], positive: [], negative: [], neutral: [] }) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return null;
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                { label: '긍정', data: data.positive, borderColor: '#2ecc71', tension: 0.1 },
                { label: '부정', data: data.negative, borderColor: '#e74c3c', tension: 0.1 },
                { label: '중립', data: data.neutral, borderColor: '#95a5a6', tension: 0.1 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateChart(chart, data) {
    if (data.labels) chart.data.labels = data.labels;
    if (data.positive) chart.data.datasets[0].data = data.positive;
    if (data.negative) chart.data.datasets[1].data = data.negative;
    if (data.neutral) chart.data.datasets[2].data = data.neutral;
    chart.update();
}

/**
 * 감성 분석 차트 UI 업데이트
 * @param {Object} stats - stats.json 데이터
 */
function updateSentimentChart(stats) {
    if (!stats.ringle || !stats.ringle.sentiment_distribution) return;

    const dist = stats.ringle.sentiment_distribution;
    // 비율 데이터(0.0~1.0)를 퍼센트로 변환하거나 개수로 환산하여 사용
    // 여기서는 도넛 차트 비중을 위해 그대로 사용
    const chartData = {
        positive: dist.positive,
        negative: dist.negative,
        neutral: dist.neutral
    };

    if (sentimentChart) {
        updateChart(sentimentChart, chartData);
    } else {
        sentimentChart = initSentimentChart('sentimentChart', chartData);
    }
}

function initSentimentChart(canvasId, data) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['긍정', '부정', '중립'],
            datasets: [{
                data: [data.positive, data.negative, data.neutral],
                backgroundColor: ['#2ecc71', '#e74c3c', '#95a5a6']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

/**
 * 워드 클라우드 렌더링
 * @param {Object} stats - stats.json 데이터
 */
function renderWordCloud(stats) {
    if (!stats.word_cloud) return;
    
    const canvas = document.getElementById('wordCloudCanvas');
    if (!canvas) return;
    
    // 캔버스 크기 맞춤
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const list = stats.word_cloud.map(item => [item.text, item.weight * 10]); // 가중치 조정

    WordCloud(canvas, {
        list: list,
        gridSize: 4,
        weightFactor: function (size) { return Math.pow(size, 0.8) * 2; },
        fontFamily: 'sans-serif',
        color: 'random-dark',
        rotateRatio: 0,
        backgroundColor: 'transparent'
    });
}

/**
 * 앱 초기화
 */
async function initApp() {
    // 초기 테이블 렌더링
    renderTable(reviewData);

    // 실제 데이터 로드 시도
    await loadDashboardData();

    // 데이터 로드 실패 등으로 차트가 생성되지 않았을 경우 빈 차트 생성 방지
    // (loadDashboardData 내부의 catch 블록에서 처리됨)
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', initApp);

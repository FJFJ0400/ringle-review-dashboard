/**
 * 링글 리뷰 분석 대시보드 - 메인 스크립트
 * DOM 조작 및 이벤트 핸들러
 */

// 차트 인스턴스 저장
let trendChart = null;
let sentimentChart = null;

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
 * 앱 초기화
 */
function initApp() {
    // 초기 테이블 렌더링
    renderTable(reviewData);

    // 차트 초기화
    trendChart = initTrendChart('trendChart');
    sentimentChart = initSentimentChart('sentimentChart');
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', initApp);

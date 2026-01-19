class FilterManager {
    constructor(data) {
        this.originalData = data;
        this.filteredData = data;
        this.filters = {
            keyword: '',
            source: [],
            sentiment: [],
            problemType: [],
            churnOnly: false
        };
        
        this.init();
    }

    init() {
        this.renderFilters();
        this.renderReviews();
        this.attachEventListeners();
    }

    renderFilters() {
        const container = document.getElementById('dynamicFilters');
        
        // 소스 필터
        const sources = ['playstore', 'appstore', 'blog', 'youtube', 'community'];
        const sourceHtml = this.createCheckboxGroup('소스', 'source', sources);

        // 감성 필터
        const sentiments = ['positive', 'neutral', 'negative'];
        const sentimentHtml = this.createCheckboxGroup('감성', 'sentiment', sentiments);

        // 문제유형 필터 (자주 등장하는 것들)
        const problems = ['accuracy', 'pricing', 'ux_ui', 'effectiveness', 'support'];
        const problemHtml = this.createCheckboxGroup('문제유형', 'problemType', problems);

        // 이탈 신호 토글
        const churnHtml = `
            <div class="filter-section">
                <label class="checkbox-label">
                    <input type="checkbox" data-filter-type="churnOnly">
                    ⚠️ 이탈 위험 신호만 보기
                </label>
            </div>
        `;

        container.innerHTML = sourceHtml + sentimentHtml + problemHtml + churnHtml;
    }

    createCheckboxGroup(title, type, items) {
        return `
            <div class="filter-section">
                <span class="filter-title">${title}</span>
                <div class="checkbox-group">
                    ${items.map(item => `
                        <label class="checkbox-label">
                            <input type="checkbox" value="${item}" data-filter-type="${type}">
                            ${this.getLabel(item)}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getLabel(key) {
        const labels = {
            'playstore': 'Play Store', 'appstore': 'App Store', 'blog': '블로그',
            'positive': '긍정', 'neutral': '중립', 'negative': '부정',
            'accuracy': 'AI 정확도', 'pricing': '가격', 'ux_ui': '사용성',
            'effectiveness': '학습효과', 'support': '고객지원'
        };
        return labels[key] || key;
    }

    attachEventListeners() {
        // 체크박스 이벤트
        document.getElementById('filterPanel').addEventListener('change', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' && target.type === 'checkbox') {
                const type = target.dataset.filterType;
                if (type === 'churnOnly') {
                    this.filters.churnOnly = target.checked;
                } else {
                    const value = target.value;
                    if (target.checked) {
                        this.filters[type].push(value);
                    } else {
                        this.filters[type] = this.filters[type].filter(item => item !== value);
                    }
                }
                this.applyFilters();
            }
        });

        // 검색어 이벤트
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.keyword = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // 정렬 이벤트
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortReviews(e.target.value);
        });
    }

    applyFilters() {
        this.filteredData = this.originalData.filter(item => {
            // 키워드 검색
            if (this.filters.keyword && !item.content.toLowerCase().includes(this.filters.keyword)) {
                return false;
            }
            // 소스 필터
            if (this.filters.source.length > 0 && !this.filters.source.includes(item.source)) {
                return false;
            }
            // 감성 필터
            if (this.filters.sentiment.length > 0 && !this.filters.sentiment.includes(item.sentiment)) {
                return false;
            }
            // 문제유형 필터 (데이터 구조에 따라 조정 필요, 여기선 category 매핑 가정)
            // 실제 데이터에서는 item.analysis.problem_type 등을 확인해야 함
            // 현재 mock data 구조(category)에 맞춰 임시 매핑 로직 사용
            if (this.filters.problemType.length > 0) {
                // 간단한 매핑 예시
                const categoryMap = { '가격': 'pricing', '앱 오류': 'ux_ui', '학습 효과': 'effectiveness' };
                const itemType = categoryMap[item.category] || 'other';
                if (!this.filters.problemType.includes(itemType)) return false;
            }
            
            return true;
        });

        this.renderReviews();
    }

    sortReviews(criteria) {
        if (criteria === 'newest') {
            // 연도/반기 문자열 비교 (임시)
            this.filteredData.sort((a, b) => (b.year + b.half).localeCompare(a.year + a.half));
        } else if (criteria === 'rating_asc') {
            // 평점 데이터가 있다면 사용, 없으면 감성으로 대체 정렬
            const score = { 'negative': 1, 'neutral': 2, 'positive': 3 };
            this.filteredData.sort((a, b) => score[a.sentiment] - score[b.sentiment]);
        }
        this.renderReviews();
    }

    renderReviews() {
        const container = document.getElementById('reviewList');
        const countEl = document.getElementById('resultCount');
        
        countEl.textContent = `검색 결과: ${this.filteredData.length}건`;
        
        if (this.filteredData.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#666;">검색 결과가 없습니다.</div>';
            return;
        }

        container.innerHTML = this.filteredData.map(review => `
            <div class="review-card">
                <div class="review-meta">
                    <span style="display:flex; align-items:center; gap:6px;">
                        ${this.getSourceIcon(review.source)} 
                        <strong>${this.getLabel(review.source)}</strong>
                    </span>
                    <span>${review.year} ${review.half === 'h1' ? '상반기' : '하반기'}</span>
                </div>
                <div class="review-content">
                    ${review.content}
                </div>
                <div class="review-tags">
                    <span class="tag sentiment-${review.sentiment}">${this.getLabel(review.sentiment)}</span>
                    <span class="tag">${review.category}</span>
                </div>
            </div>
        `).join('');
    }

    getSourceIcon(source) {
        const icons = { 'playstore': '▶️', 'appstore': '🍎', 'blog': '📝', 'community': '💬' };
        return icons[source] || '📄';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // reviewData는 data.js에서 로드됨
    window.filterManager = new FilterManager(reviewData);
});
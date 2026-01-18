/**
 * 링글 리뷰 분석 대시보드 - 데이터 모듈
 * 리뷰 데이터 및 관련 유틸리티 함수
 */

// 리뷰 데이터
const reviewData = [
    { year: '2021', half: 'h1', source: 'blog', category: '학습 효과', content: '47세로 유튜브 광고 보고 시작, 외국인 직원들과 영어 대화 시작하게 됨', sentiment: 'positive' },
    { year: '2021', half: 'h2', source: 'blog', category: '튜터 품질', content: '아이비리그 출신 튜터의 어휘력, 논리력이 일반 학원보다 월등', sentiment: 'positive' },
    { year: '2022', half: 'h1', source: 'blog', category: '교재 품질', content: '매주 새로운 교재, 비즈니스 트렌드와 기업 Success Factor 학습 가능', sentiment: 'positive' },
    { year: '2022', half: 'h2', source: 'blog', category: '학습 효과', content: '2년간 347회 수업 후 해외 바이어와 자연스러운 대화 가능 수준까지 향상', sentiment: 'positive' },
    { year: '2022', half: 'h2', source: 'community', category: '가격', content: '다른 화상영어 대비 가격이 거의 2배, 부담스러움', sentiment: 'negative' },
    { year: '2023', half: 'h1', source: 'blog', category: '피드백 시스템', content: '전화영어와 달리 실시간 교정, 구글닥스로 틀린 부분 확인 가능', sentiment: 'positive' },
    { year: '2023', half: 'h1', source: 'playstore', category: '앱 오류', content: '앱 업데이트 후 자주 크래시 발생', sentiment: 'negative' },
    { year: '2023', half: 'h2', source: 'blog', category: '학습 효과', content: '스터디클럽 참여 후 6개월간 CAFP 점수 크게 향상', sentiment: 'positive' },
    { year: '2023', half: 'h2', source: 'appstore', category: '앱 발열', content: '강의 녹음 재생 시 휴대폰 발열이 유튜브보다 심함', sentiment: 'negative' },
    { year: '2024', half: 'h1', source: 'blog', category: '가격', content: '콘텐츠 투자해도 매년 가격 인상, 안정화 필요', sentiment: 'negative' },
    { year: '2024', half: 'h1', source: 'blog', category: 'AI 튜터', content: 'AI 튜터 기능 추가, 초중급자에게 적합하나 고급자는 1:1 화상 선호', sentiment: 'neutral' },
    { year: '2024', half: 'h1', source: 'blog', category: '비즈니스 영어', content: '외국계 기업 합격, 대학원 입학 등 목표 달성 후기 다수', sentiment: 'positive' },
    { year: '2024', half: 'h2', source: 'community', category: '환불 정책', content: '수강기간 만료 시 자동 소멸, 환불 불가 정책에 불만', sentiment: 'negative' },
    { year: '2024', half: 'h2', source: 'blog', category: '예약 시스템', content: '인기 튜터 예약 경쟁 치열, 수강신청이 번거로움', sentiment: 'negative' },
    { year: '2024', half: 'h2', source: 'playstore', category: '튜터 품질', content: '새로 온 튜터 50% 포인트백으로 신규 튜터 수업 유도', sentiment: 'neutral' },
    { year: '2025', half: 'h1', source: 'playstore', category: '앱 오류', content: 'Errors occur often - 오류가 자주 발생함', sentiment: 'negative' },
    { year: '2025', half: 'h1', source: 'blog', category: '종합 만족', content: '1년 6개월 사용 후 여러 플랫폼 중 가장 만족, 계속 사용 예정', sentiment: 'positive' },
    { year: '2025', half: 'h1', source: 'appstore', category: '시스템 발전', content: '1년간 교재, 웨비나, 진단 등 학습 시스템이 지속 발전', sentiment: 'positive' },
];

// 소스 레이블 매핑
const sourceLabels = {
    'blog': '블로그',
    'playstore': 'Play Store',
    'appstore': 'App Store',
    'community': '커뮤니티'
};

// 감성 레이블 매핑
const sentimentLabels = {
    'positive': '긍정',
    'negative': '부정',
    'neutral': '중립'
};

/**
 * 소스 코드를 한글 레이블로 변환
 * @param {string} source - 소스 코드
 * @returns {string} 한글 레이블
 */
function getSourceLabel(source) {
    return sourceLabels[source] || source;
}

/**
 * 감성 코드를 한글 레이블로 변환
 * @param {string} sentiment - 감성 코드
 * @returns {string} 한글 레이블
 */
function getSentimentLabel(sentiment) {
    return sentimentLabels[sentiment] || sentiment;
}

/**
 * 리뷰 데이터 필터링
 * @param {Object} filters - 필터 조건 객체
 * @returns {Array} 필터링된 리뷰 배열
 */
function filterReviewData(filters) {
    return reviewData.filter(review => {
        if (filters.year && filters.year !== 'all' && review.year !== filters.year) return false;
        if (filters.half && filters.half !== 'all' && review.half !== filters.half) return false;
        if (filters.sentiment && filters.sentiment !== 'all' && review.sentiment !== filters.sentiment) return false;
        if (filters.source && filters.source !== 'all' && review.source !== filters.source) return false;
        return true;
    });
}

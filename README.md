# Ringle Voice Insights (RVI)

링글(Ringle) AI 서비스의 고객 여론(VOC)을 실시간으로 수집하고 분석하여 전략적 인사이트를 제공하는 대시보드입니다.

## 🌟 주요 기능

- **📊 멀티 채널 자동 수집**: Google Play Store, App Store, YouTube, 네이버 블로그 등 5개 채널의 데이터를 자동으로 수집합니다.
- **🤖 AI 기반 자동 분석**: Claude API를 활용하여 리뷰의 감성, 문제 유형, 이탈 신호 등을 자동으로 태깅하고 분석합니다.
- **📈 실시간 대시보드**: 수집된 데이터를 시각화하여 트렌드, 이슈, 경쟁사 비교 정보를 한눈에 파악할 수 있습니다.
- **🔍 고급 탐색 및 필터**: 키워드, 기간, 감성 등 다양한 조건으로 VOC를 상세하게 탐색할 수 있습니다.
- **📝 자동 리포트 생성**: 주간/월간 인사이트 리포트를 자동으로 생성하여 PDF로 저장하거나 공유할 수 있습니다.

## 🏗️ 아키텍처

- **수집/분석 (Backend)**: GitHub Actions (Python 스크립트 실행, 일 2회)
- **대시보드 (Frontend)**: GitHub Pages (HTML5, CSS3, Vanilla JS, Chart.js)
- **데이터 저장**: Git Repository (JSON 파일 형태)
- **비용**: 서버 비용 무료 (GitHub 활용), Claude API 비용 월 $5~15 예상

## 📸 스크린샷 (Screenshots)

| 대시보드 메인 | VOC 탐색 |
|:---:|:---:|
| ![Dashboard](assets/screenshot-dashboard.png) | ![Explore](assets/screenshot-explore.png) |
| **인사이트 리포트** | **수동 업로드** |
| ![Report](assets/screenshot-report.png) | ![Upload](assets/screenshot-upload.png) |

## � 시작하기

### 1. 사전 요구사항
- Python 3.11 이상
- GitHub 계정
- Anthropic (Claude) API Key

### 2. 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/ringle-voice-insights.git
cd ringle-voice-insights

# 의존성 설치
pip install -r collector/requirements.txt

# 수집기 실행 (테스트)
python collector/main.py --mode collect
```

### 3. GitHub Secrets 설정
GitHub Actions 자동화를 위해 Repository Settings > Secrets and variables > Actions에 다음 변수를 등록해야 합니다.

- `CLAUDE_API_KEY`: Anthropic API 키
- `YOUTUBE_API_KEY`: YouTube Data API 키
- `NAVER_CLIENT_ID`: 네이버 개발자 Client ID
- `NAVER_CLIENT_SECRET`: 네이버 개발자 Client Secret

### 4. GitHub Pages 활성화
Repository Settings > Pages 메뉴에서 `Source`를 `Deploy from a branch`로 설정하고, `main` 브랜치(또는 `master`)를 선택하여 저장합니다.

## ⚠️ 배포 및 운영 주의사항

### 1. API 비용 관리
- **Claude API**: 리뷰 1,000건 분석 시 약 $0.5~$2.0 소요 (모델 및 리뷰 길이에 따라 상이). `config.py`에서 `count_per_app`을 조절하여 비용을 통제하세요.
- **YouTube/Naver API**: 무료 할당량이 있으나 초과 시 과금될 수 있으므로 쿼터 설정을 확인하세요.

### 2. 데이터 보안
- 수집된 데이터(`data/`)는 공개 저장소(Public Repo)에 커밋될 경우 누구나 볼 수 있습니다. 민감한 데이터가 포함된다면 **Private Repository**를 사용하세요.
- API Key는 절대 코드에 포함하지 말고 GitHub Secrets나 `.env` 파일로 관리하세요.

### 3. GitHub Actions 제한
- 무료 계정의 경우 월 2,000분의 실행 시간이 제공됩니다. 수집 주기를 너무 짧게 설정하지 마세요.

## 📂 프로젝트 구조

```
/ringle-voice-insights
├── .github/workflows/     # GitHub Actions 워크플로우 (자동 수집)
├── collector/             # Python 수집 및 분석 스크립트
│   ├── sources/           # 채널별 수집기
│   ├── analyzer/          # Claude API 분석기
│   └── utils/             # 데이터 집계 유틸리티
├── data/                  # 수집 및 분석된 데이터 (JSON)
├── web/                   # 프론트엔드 대시보드 소스
│   ├── pages/             # HTML 페이지 (탐색, 리포트, 설정 등)
│   ├── scripts/           # JS 로직 (차트, 필터 등)
│   └── styles/            # CSS 스타일
└── README.md              # 프로젝트 문서
```

## 📊 채널별 수집 현황

| 채널 | 상태 | 수집 대상 | 비고 |
|------|------|-----------|------|
| Play Store | ✅ | 링글 + 경쟁사 6개 | API 사용 |
| App Store | ✅ | 링글 + 경쟁사 6개 | 스크래핑 |
| YouTube | ✅ | 공식 채널 + 검색 | API Key 필요 |
| 네이버 블로그 | ✅ | 키워드 검색 | API Key 필요 |
| 수동 업로드 | ✅ | CSV / 직접 입력 | 폐쇄 커뮤니티용 |

## 🗺️ 로드맵

- [ ] Slack / Email 알림 연동
- [ ] 경쟁사 추가 및 비교 분석 강화
- [ ] 사용자 정의 태그 시스템 도입
- [ ] 팀 공유 및 협업 기능

## 📄 라이선스
MIT License
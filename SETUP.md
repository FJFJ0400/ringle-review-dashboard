# Ringle Voice Insights (RVI) 설정 및 실행 가이드

이 문서는 RVI 프로젝트를 로컬 환경에 설치하고, 데이터를 수집/분석하여 대시보드를 실행하는 방법을 안내합니다.

## 1. 환경 설정 (Prerequisites)

### 필수 요구사항
- **Python 3.11+**: 수집 및 분석 스크립트 실행용
- **Git**: 소스 코드 관리
- **Web Browser**: 대시보드 확인용 (Chrome, Edge 등)

### API 키 준비
다음 서비스들의 API 키가 필요합니다. (없을 경우 일부 기능이 제한됩니다)
1. **Anthropic API Key**: Claude AI 분석용 (필수)
2. **YouTube Data API Key**: 유튜브 댓글 수집용
3. **Naver Search API (Client ID/Secret)**: 블로그 검색용

---

## 2. 설치 (Installation)

### 저장소 클론
```bash
git clone https://github.com/YOUR_USERNAME/ringle-voice-insights.git
cd ringle-voice-insights
```

### Python 가상환경 생성 (권장)
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 의존성 패키지 설치
```bash
pip install -r collector/requirements.txt
```
*만약 `requirements.txt`가 없다면 다음 명령어로 필수 패키지를 설치하세요:*
```bash
pip install anthropic google-play-scraper app-store-scraper google-api-python-client requests pandas python-dotenv
```

### 환경 변수 설정 (.env)
프로젝트 루트에 `.env` 파일을 생성하고 API 키를 입력합니다.
```ini
# .env file
CLAUDE_API_KEY=sk-ant-api03-...
YOUTUBE_API_KEY=AIzaSy...
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

---

## 3. 데이터 수집 및 분석 실행

`collector/main.py` 스크립트를 사용하여 수집부터 집계까지 한 번에 실행할 수 있습니다.

### 전체 파이프라인 실행 (수집 -> 분석 -> 집계)
```bash
python collector/main.py --mode all
```

### 단계별 실행
```bash
# 1. 데이터 수집 (PlayStore, AppStore 등)
python collector/main.py --mode collect

# 2. AI 분석 (Claude API 사용)
python collector/main.py --mode analyze

# 3. 데이터 집계 (JSON 파일 생성)
python collector/main.py --mode aggregate
```

*실행이 완료되면 `data/aggregated/` 폴더에 `stats.json`, `trends.json` 등이 생성됩니다.*

---

## 4. 대시보드 실행 (Frontend)

이 프로젝트는 별도의 백엔드 서버 없이 정적 파일(HTML/JS)로 동작합니다.

1. 프로젝트 폴더의 `index.html` 파일을 브라우저로 엽니다.
2. 또는 VS Code의 **Live Server** 확장을 사용하여 실행하면 더 원활하게 작동합니다.
3. 대시보드 차트가 로컬에 생성된 `data/aggregated/*.json` 데이터를 불러와 표시하는지 확인합니다.
   *(브라우저 보안 정책으로 인해 로컬 파일 직접 열기 시 fetch 에러가 발생할 수 있습니다. 이 경우 Live Server 사용을 권장합니다.)*
import os

# 환경 변수 로드 (로컬 개발용)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# API Keys
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

# 앱스토어 앱 ID
APPS = {
    "ringle": {
        "playstore": "com.ringleplus.ringle",
        "appstore": "1193987818",
        "name": "링글",
        "is_target": True  # 우리 서비스
    },
    "speak": {
        "playstore": "com.speakeasy.speak",
        "appstore": "1286609883",
        "name": "스픽",
        "is_target": False  # 경쟁사
    },
    "elsa": {
        "playstore": "us.nobarriers.elsa",
        "appstore": "1083804886",
        "name": "ELSA",
        "is_target": False
    },
    "cambly": {
        "playstore": "com.cambly.cambly",
        "appstore": "564638159",
        "name": "캠블리",
        "is_target": False
    },
    "tutoring": {
        "playstore": "com.tutoring",
        "appstore": "1033880928", 
        "name": "튜터링",
        "is_target": False
    },
    "santa": {
        "playstore": "co.riiid.vida",
        "appstore": "1205994709",
        "name": "산타토익",
        "is_target": False
    },
    "duolingo": {
        "playstore": "com.duolingo",
        "appstore": "570060128",
        "name": "듀오링고",
        "is_target": False
    }
}

# 검색 키워드 (블로그, 유튜브용)
SEARCH_KEYWORDS = {
    "primary": [  # 링글 직접 언급
        "링글 AI",
        "링글 AI 후기",
        "링글 AI 영어",
        "링글 AI 튜터",
        "ringle AI"
    ],
    "secondary": [  # AI 영어 학습 일반
        "AI 영어 회화",
        "AI 영어 피드백",
        "AI 스피킹",
        "인공지능 영어"
    ],
    "competitive": [  # 경쟁 비교
        "스픽 vs 링글",
        "AI 영어 앱 비교",
        "영어회화 앱 추천"
    ]
}

# 유튜브 채널
YOUTUBE_CHANNELS = {
    "ringle_official": "UC_Ringle_Official_ID",  # 실제 ID로 교체 필요
}

# 수집 설정
COLLECTION_CONFIG = {
    "playstore": {
        "count_per_app": 200,        # 앱당 수집 리뷰 수
        "lang": "ko",
        "country": "kr"
    },
    "appstore": {
        "count_per_app": 200,
        "country": "kr"
    },
    "youtube": {
        "max_results_per_video": 100,
        "max_videos_per_search": 10
    },
    "naver_blog": {
        "display": 100,              # 검색당 결과 수
        "sort": "date"               # 최신순
    },
    "brunch": {
        "max_articles": 50
    }
}

# 데이터 스키마 (참조용)
RAW_SCHEMA = {
    "id": "string (uuid)",
    "source": "dict",
    "external_id": "string",
    "author": "string|null",
    "rating": "number|null",
    "text": "string",
    "created_at": "ISO datetime",
    "collected_at": "ISO datetime",
    "metadata": "dict"
}

ANALYZED_SCHEMA = {
    "id": "string",
    "raw_id": "string",
    "source_type": "string",
    "is_target": "boolean",
    "text": "string",
    "analysis": "dict",
    "analyzed_at": "ISO datetime"
}
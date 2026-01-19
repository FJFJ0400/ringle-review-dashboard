import argparse
import os
import sys
import json
import random
from datetime import datetime, timedelta

# 부모 디렉토리의 모듈을 임포트하기 위해 경로 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
# 만약 collector 폴더 안에서 실행된 경우에만 부모 경로 추가
if os.path.basename(current_dir) == 'collector':
    sys.path.append(os.path.dirname(current_dir))

try:
    from aggregator import DataAggregator
except ImportError as e:
    print(f"Critical Error: Failed to import 'aggregator'. {e}")
    sys.exit(1)

try:
    from claude_client import ClaudeAnalyzer
except ImportError as e:
    print(f"Warning: Failed to import 'claude_client' ({e}). Analysis features will be disabled.")
    ClaudeAnalyzer = None

# 수집기 모듈 임포트
try:
    # 패키지로 실행 시 (.playstore)
    from .playstore import PlayStoreCollector
    from .appstore import AppStoreCollector
    from .youtube import YouTubeCollector
    from .naver_blog import NaverBlogCollector
    from .brunch import BrunchCollector
except ImportError:
    # 스크립트로 실행 시 (playstore)
    from playstore import PlayStoreCollector
    from appstore import AppStoreCollector
    from youtube import YouTubeCollector
    from naver_blog import NaverBlogCollector
    from brunch import BrunchCollector

def generate_mock_data(base_dir):
    """MVP 테스트를 위한 더미 데이터 생성"""
    analyzed_dir = os.path.join(base_dir, "data", "analyzed")
    aggregated_dir = os.path.join(base_dir, "data", "aggregated")
    os.makedirs(analyzed_dir, exist_ok=True)
    os.makedirs(aggregated_dir, exist_ok=True)
    
    print(f"[Mock] Generating sample data in {analyzed_dir}...")
    
    sources = ["AppStore", "PlayStore", "NaverBlog", "YouTube"]
    sentiments = ["positive", "neutral", "negative"]
    problem_types = ["Audio Quality", "App Stability", "Tutor Matching", "Pricing", "UI/UX"]
    
    # 50개의 더미 리뷰 생성
    for i in range(50):
        is_target = random.choice([True, True, False]) # Ringle 비중을 높게
        source = random.choice(sources)
        sentiment = random.choice(sentiments)
        created_at = datetime.now() - timedelta(days=random.randint(0, 30))
        
        data = {
            "id": f"mock_{i}",
            "source_type": source,
            "source_name": "Ringle" if is_target else "Competitor_A",
            "is_target": is_target,
            "text": f"This is a mock review content #{i}. The service is {sentiment}.",
            "rating": random.randint(1, 5) if sentiment != "negative" else random.randint(1, 3),
            "created_at": created_at.isoformat(),
            "analysis": {
                "sentiment": sentiment,
                "problem_type": random.choice(problem_types) if sentiment == "negative" else None,
                "key_phrases": ["mock", "test", "service"],
                "churn_signal": (random.random() < 0.2) if sentiment == "negative" else False,
                "churn_keywords": ["refund", "cancel", "quit"] if sentiment == "negative" else []
            }
        }
        
        with open(os.path.join(analyzed_dir, f"mock_{i}.json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
    # Mock Top Issues 생성
    top_issues = {
        "issues": [
            {"problem_type": "Audio Quality", "count": 12, "summary": "음질 끊김 및 잡음 문제 다수 발생", "sentiment_score": -0.8},
            {"problem_type": "Pricing", "count": 8, "summary": "구독료 인상에 대한 불만", "sentiment_score": -0.6},
            {"problem_type": "App Stability", "count": 5, "summary": "업데이트 후 앱 강제 종료 현상", "sentiment_score": -0.9},
            {"problem_type": "UI/UX", "count": 4, "summary": "메뉴 찾기가 어려움", "sentiment_score": -0.4}
        ],
        "churn_alerts": [
            {
                "keyword": "환불",
                "count": 5,
                "recent_examples": [{"text": "환불 절차가 너무 복잡해서 다시는 이용하고 싶지 않습니다."}]
            }
        ]
    }
    with open(os.path.join(aggregated_dir, "top-issues.json"), "w", encoding="utf-8") as f:
        json.dump(top_issues, f, ensure_ascii=False, indent=2)

def run_analysis(base_dir):
    """Claude API를 사용하여 수집된 데이터 분석"""
    print("[Analyze] Starting analysis with Claude API...")
    
    raw_dir = os.path.join(base_dir, "data", "raw")
    analyzed_dir = os.path.join(base_dir, "data", "analyzed")
    os.makedirs(analyzed_dir, exist_ok=True)
    
    if ClaudeAnalyzer is None:
        print("    Skipping analysis: ClaudeAnalyzer module is missing.")
        return

    try:
        analyzer = ClaudeAnalyzer()
        if not analyzer.client:
            print("    Skipping analysis: Claude client not initialized (check API Key).")
            return
    except Exception as e:
        print(f"    Error initializing ClaudeAnalyzer: {e}")
        return

    raw_files = []
    for root, dirs, files in os.walk(raw_dir):
        for file in files:
            if file.endswith(".json"):
                raw_files.append(os.path.join(root, file))
    
    print(f"    Found {len(raw_files)} raw data files.")
    
    for file_path in raw_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                items = json.load(f)
            if isinstance(items, dict): items = [items]
                
            print(f"    Analyzing {os.path.basename(file_path)} ({len(items)} items)...")
            for item in items:
                if item.get("text"):
                    result = analyzer.analyze(item)
                    if result:
                        with open(os.path.join(analyzed_dir, f"{item['id']}.json"), "w", encoding="utf-8") as f:
                            json.dump(result, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"    Error analyzing {file_path}: {e}")

def run_collection(base_dir):
    """모든 채널 데이터 수집 실행"""
    print("[Collect] Starting data collection...")
    
    collectors = [
        PlayStoreCollector(),
        AppStoreCollector(),
        YouTubeCollector(),
        NaverBlogCollector(),
        BrunchCollector()
    ]
    
    for collector in collectors:
        source_type = collector.get_source_type()
        print(f"  - Running {source_type} collector...")
        try:
            items = collector.collect()
            if items:
                raw_dir = os.path.join(base_dir, "data", "raw", source_type)
                os.makedirs(raw_dir, exist_ok=True)
                
                filename = f"{source_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                with open(os.path.join(raw_dir, filename), "w", encoding="utf-8") as f:
                    json.dump(items, f, ensure_ascii=False, indent=2)
                print(f"    Saved {len(items)} items to {filename}")
            else:
                print(f"    No items collected for {source_type}")
        except Exception as e:
            print(f"    Error in {source_type} collector: {e}")

def main():
    parser = argparse.ArgumentParser(description="RVI Data Pipeline")
    parser.add_argument("--mode", choices=["collect", "analyze", "aggregate", "all"], default="all")
    args = parser.parse_args()
    
    # 스크립트 위치에 따라 base_dir 설정 (collector 폴더 내 실행 vs 루트 실행 대응)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.basename(current_dir) == 'collector':
        base_dir = os.path.dirname(current_dir)
    else:
        base_dir = current_dir
    
    # 1. Collect (Mock)
    if args.mode in ["collect", "all"]:
        print(">>> Step 1: Collection")
        run_collection(base_dir)
        # Mock 데이터는 필요 시 주석 해제하여 사용
        # generate_mock_data(base_dir)
        
    # 2. Analyze
    if args.mode in ["analyze", "all"]:
        print(">>> Step 2: Analysis")
        run_analysis(base_dir)
        
    # 3. Aggregate
    if args.mode in ["aggregate", "all"]:
        print(">>> Step 3: Aggregation")
        aggregator = DataAggregator(os.path.join(base_dir, "data"))
        aggregator.aggregate_all()
        print("    Aggregation complete. Check 'data/aggregated/'")

if __name__ == "__main__":
    main()
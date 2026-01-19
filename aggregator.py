import json
import os
import logging
from datetime import datetime
from collections import defaultdict, Counter
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class DataAggregator:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.analyzed_dir = os.path.join(data_dir, "analyzed")
        self.aggregated_dir = os.path.join(data_dir, "aggregated")
        
        # 집계 데이터 저장 디렉토리 생성
        os.makedirs(self.aggregated_dir, exist_ok=True)

    def aggregate_all(self) -> None:
        """모든 집계 데이터 생성/업데이트"""
        items = self._load_analyzed_items()
        if not items:
            logger.warning("No analyzed items found.")
            return

        logger.info(f"Aggregating {len(items)} items...")
        self.generate_stats(items)
        self.generate_trends(items)
        self.generate_top_issues(items)
        logger.info("Aggregation complete.")
    
    def _load_analyzed_items(self) -> List[Dict[str, Any]]:
        items = []
        if not os.path.exists(self.analyzed_dir):
            return items
            
        for filename in os.listdir(self.analyzed_dir):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(self.analyzed_dir, filename), "r", encoding="utf-8") as f:
                        items.append(json.load(f))
                except Exception as e:
                    logger.error(f"Error loading {filename}: {e}")
        return items

    def generate_stats(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """기본 통계 생성 (stats.json)"""
        stats = {
            "updated_at": datetime.now().isoformat(),
            "total": {
                "reviews": len(items),
                "sources": defaultdict(int)
            },
            "ringle": {
                "total": 0,
                "average_rating": 0.0,
                "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0},
                "problem_type_distribution": defaultdict(int),
                "churn_signal_rate": 0.0
            },
            "competitors": defaultdict(lambda: {
                "total": 0,
                "average_rating": 0.0,
                "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0},
                "ratings": [] # 임시 저장
            })
        }
        
        ringle_ratings = []
        ringle_churn_count = 0
        word_counts = Counter()
        
        for item in items:
            # Source count
            source_type = item.get("source_type", "unknown")
            stats["total"]["sources"][source_type] += 1
            
            analysis = item.get("analysis", {})
            sentiment = analysis.get("sentiment", "neutral")
            rating = item.get("rating")
            
            if item.get("is_target"):
                # Ringle
                stats["ringle"]["total"] += 1
                stats["ringle"]["sentiment_distribution"][sentiment] += 1
                if rating is not None:
                    ringle_ratings.append(rating)
                
                pt = analysis.get("problem_type")
                if pt:
                    stats["ringle"]["problem_type_distribution"][pt] += 1
                
                # Word Cloud Keywords
                phrases = analysis.get("key_phrases", [])
                if phrases:
                    for p in phrases:
                        word_counts[p] += 1
                
                if analysis.get("churn_signal"):
                    ringle_churn_count += 1
            else:
                # Competitors
                comp_name = item.get("source_name", "unknown")
                comp_stats = stats["competitors"][comp_name]
                comp_stats["total"] += 1
                comp_stats["sentiment_distribution"][sentiment] += 1
                if rating is not None:
                    comp_stats["ratings"].append(rating)

        # Calculate Ringle Averages
        r_total = stats["ringle"]["total"]
        if r_total > 0:
            if ringle_ratings:
                stats["ringle"]["average_rating"] = round(sum(ringle_ratings) / len(ringle_ratings), 2)
            
            for k in stats["ringle"]["sentiment_distribution"]:
                stats["ringle"]["sentiment_distribution"][k] = round(stats["ringle"]["sentiment_distribution"][k] / r_total, 2)
            
            for k in stats["ringle"]["problem_type_distribution"]:
                stats["ringle"]["problem_type_distribution"][k] = round(stats["ringle"]["problem_type_distribution"][k] / r_total, 2)
                
            stats["ringle"]["churn_signal_rate"] = round(ringle_churn_count / r_total, 2)

        # Calculate Competitor Averages
        for name, data in stats["competitors"].items():
            c_total = data["total"]
            if c_total > 0:
                ratings = data.pop("ratings")
                if ratings:
                    data["average_rating"] = round(sum(ratings) / len(ratings), 2)
                
                for k in data["sentiment_distribution"]:
                    data["sentiment_distribution"][k] = round(data["sentiment_distribution"][k] / c_total, 2)
            else:
                data.pop("ratings", None)

        # Word Cloud Data (Top 50)
        stats["word_cloud"] = [{"text": k, "weight": v} for k, v in word_counts.most_common(50)]

        # Save
        with open(os.path.join(self.aggregated_dir, "stats.json"), "w", encoding="utf-8") as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
            
        return stats

    def generate_trends(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """시계열 트렌드 생성 (trends.json)"""
        daily_groups = defaultdict(lambda: {
            "ringle": {"count": 0, "ratings": [], "sentiment": {"positive": 0, "neutral": 0, "negative": 0}, "churn_signals": 0},
            "competitors": defaultdict(lambda: {"count": 0, "ratings": [], "sentiment": {"positive": 0, "neutral": 0, "negative": 0}})
        })
        
        for item in items:
            created_at = item.get("created_at")
            if not created_at:
                continue
            date_str = created_at.split("T")[0]
            
            group = daily_groups[date_str]
            analysis = item.get("analysis", {})
            sentiment = analysis.get("sentiment", "neutral")
            rating = item.get("rating")
            
            if item.get("is_target"):
                group["ringle"]["count"] += 1
                group["ringle"]["sentiment"][sentiment] += 1
                if rating is not None:
                    group["ringle"]["ratings"].append(rating)
                if analysis.get("churn_signal"):
                    group["ringle"]["churn_signals"] += 1
            else:
                comp_name = item.get("source_name", "unknown")
                c_group = group["competitors"][comp_name]
                c_group["count"] += 1
                c_group["sentiment"][sentiment] += 1
                if rating is not None:
                    c_group["ratings"].append(rating)
        
        daily_list = []
        for date in sorted(daily_groups.keys()):
            data = daily_groups[date]
            
            # Ringle Avg
            r_ratings = data["ringle"].pop("ratings")
            data["ringle"]["avg_rating"] = round(sum(r_ratings) / len(r_ratings), 2) if r_ratings else None
            
            # Competitor Avg
            for c_name, c_data in data["competitors"].items():
                c_ratings = c_data.pop("ratings")
                c_data["avg_rating"] = round(sum(c_ratings) / len(c_ratings), 2) if c_ratings else None
            
            daily_list.append({
                "date": date,
                **data
            })
            
        trends = {
            "updated_at": datetime.now().isoformat(),
            "daily": daily_list
        }
        
        with open(os.path.join(self.aggregated_dir, "trends.json"), "w", encoding="utf-8") as f:
            json.dump(trends, f, ensure_ascii=False, indent=2)
            
        return trends

    def generate_top_issues(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Top 이슈 추출 (top-issues.json)"""
        ringle_items = [i for i in items if i.get("is_target")]
        
        # 1. Negative Issues
        neg_items = [i for i in ringle_items if i.get("analysis", {}).get("sentiment") == "negative"]
        neg_counts = Counter([i.get("analysis", {}).get("problem_type") for i in neg_items if i.get("analysis", {}).get("problem_type")])
        
        negative_issues = []
        for pt, count in neg_counts.most_common(5):
            related = [i for i in neg_items if i.get("analysis", {}).get("problem_type") == pt]
            keywords = Counter()
            for r in related:
                for k in r.get("analysis", {}).get("key_phrases", []):
                    keywords[k] += 1
            
            negative_issues.append({
                "problem_type": pt,
                "count": count,
                "severity": "high" if count >= 10 else "medium",
                "representative_reviews": self._select_representative_reviews(related),
                "keywords": [k for k, v in keywords.most_common(5)]
            })
            
        # 2. Positive Highlights
        pos_items = [i for i in ringle_items if i.get("analysis", {}).get("sentiment") == "positive"]
        pos_counts = Counter([i.get("analysis", {}).get("problem_type") for i in pos_items if i.get("analysis", {}).get("problem_type")])
        
        positive_highlights = []
        for pt, count in pos_counts.most_common(5):
            related = [i for i in pos_items if i.get("analysis", {}).get("problem_type") == pt]
            keywords = Counter()
            for r in related:
                for k in r.get("analysis", {}).get("key_phrases", []):
                    keywords[k] += 1
            
            positive_highlights.append({
                "problem_type": pt,
                "count": count,
                "representative_reviews": self._select_representative_reviews(related),
                "keywords": [k for k, v in keywords.most_common(5)]
            })
            
        # 3. Churn Alerts
        churn_items = [i for i in ringle_items if i.get("analysis", {}).get("churn_signal")]
        churn_alerts = []
        if churn_items:
            churn_kws = Counter()
            for i in churn_items:
                for k in i.get("analysis", {}).get("churn_keywords", []):
                    churn_kws[k] += 1
            
            for kw, count in churn_kws.most_common(5):
                related = [i for i in churn_items if kw in i.get("analysis", {}).get("churn_keywords", [])]
                churn_alerts.append({
                    "keyword": kw,
                    "count": count,
                    "recent_examples": self._select_representative_reviews(related)
                })
                
        # 4. Competitor Comparisons
        comp_items = [i for i in ringle_items if i.get("analysis", {}).get("competitor_mentions")]
        competitor_comparisons = []
        comp_mentions = Counter()
        for i in comp_items:
            for m in i.get("analysis", {}).get("competitor_mentions", []):
                comp_mentions[m] += 1
        
        for comp, count in comp_mentions.most_common():
            related = [i for i in comp_items if comp in i.get("analysis", {}).get("competitor_mentions", [])]
            competitor_comparisons.append({
                "competitor": comp,
                "mention_count": count,
                "examples": self._select_representative_reviews(related)
            })
            
        top_issues = {
            "updated_at": datetime.now().isoformat(),
            "ringle": {
                "negative_issues": negative_issues,
                "positive_highlights": positive_highlights,
                "churn_alerts": churn_alerts,
                "competitor_comparisons": competitor_comparisons
            }
        }
        
        with open(os.path.join(self.aggregated_dir, "top-issues.json"), "w", encoding="utf-8") as f:
            json.dump(top_issues, f, ensure_ascii=False, indent=2)
            
        return top_issues

    def _select_representative_reviews(self, items: List[Dict[str, Any]], count: int = 3) -> List[Dict[str, Any]]:
        """대표 리뷰 선정 (길이순 + 최신순)"""
        # 텍스트 길이로 정렬
        sorted_items = sorted(items, key=lambda x: len(x.get("text", "")), reverse=True)
        
        selected = []
        for item in sorted_items[:count]:
            selected.append({
                "id": item.get("id"),
                "text": item.get("text"),
                "source": item.get("source_type"),
                "rating": item.get("rating"),
                "created_at": item.get("created_at")
            })
        return selected
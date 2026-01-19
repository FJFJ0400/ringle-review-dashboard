import time
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any

from google_play_scraper import reviews, Sort
from config import APPS, COLLECTION_CONFIG
try:
    from .base import BaseCollector
except ImportError:
    from base import BaseCollector

logger = logging.getLogger(__name__)

class PlayStoreCollector(BaseCollector):
    """
    Google Play Store 리뷰 수집
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config or COLLECTION_CONFIG["playstore"])
        self.apps = APPS

    def get_source_type(self) -> str:
        return "playstore"

    def collect(self) -> List[Dict[str, Any]]:
        results = []
        
        for app_key, app_info in self.apps.items():
            if not app_info.get("playstore"):
                continue
                
            app_id = app_info["playstore"]
            app_name = app_info["name"]
            
            logger.info(f"Collecting Play Store reviews for {app_name} ({app_id})...")
            
            try:
                collected_reviews, _ = reviews(
                    app_id,
                    lang=self.config.get("lang", "ko"),
                    country=self.config.get("country", "kr"),
                    sort=Sort.NEWEST,
                    count=self.config.get("count_per_app", 200)
                )
                
                for review in collected_reviews:
                    item = {
                        "id": str(uuid.uuid4()),
                        "source": {
                            "type": "playstore",
                            "name": app_name,
                            "app_key": app_key,
                            "url": f"https://play.google.com/store/apps/details?id={app_id}&reviewId={review['reviewId']}"
                        },
                        "external_id": review['reviewId'],
                        "author": review['userName'],
                        "rating": review['score'],
                        "text": review['content'],
                        "created_at": review['at'].isoformat() if review.get('at') else datetime.now().isoformat(),
                        "collected_at": datetime.now().isoformat(),
                        "metadata": {
                            "thumbs_up": review.get('thumbsUpCount'),
                            "reply_count": 0,
                            "app_version": review.get('reviewCreatedVersion')
                        }
                    }
                    results.append(item)
                    
                logger.info(f"Collected {len(collected_reviews)} reviews for {app_name}")
                time.sleep(1)  # Rate limit
                
            except Exception as e:
                logger.error(f"Error collecting Play Store reviews for {app_name}: {e}")
                
        return results
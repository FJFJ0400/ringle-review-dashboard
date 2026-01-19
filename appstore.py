import time
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any

from app_store_scraper import AppStore
from config import APPS, COLLECTION_CONFIG
try:
    from .base import BaseCollector
except ImportError:
    from base import BaseCollector

logger = logging.getLogger(__name__)

class AppStoreCollector(BaseCollector):
    """
    Apple App Store 리뷰 수집
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config or COLLECTION_CONFIG["appstore"])
        self.apps = APPS

    def get_source_type(self) -> str:
        return "appstore"

    def collect(self) -> List[Dict[str, Any]]:
        results = []
        
        for app_key, app_info in self.apps.items():
            if not app_info.get("appstore"):
                continue
                
            app_id = app_info["appstore"]
            app_name = app_info["name"]
            
            logger.info(f"Collecting App Store reviews for {app_name} ({app_id})...")
            
            try:
                # app_store_scraper는 app_name과 app_id가 필요합니다.
                scraper = AppStore(
                    country=self.config.get("country", "kr"),
                    app_name=app_key,  # 라이브러리 검색용 이름 (slug)
                    app_id=app_id
                )
                
                scraper.review(how_many=self.config.get("count_per_app", 200))
                
                for review in scraper.reviews:
                    item = {
                        "id": str(uuid.uuid4()),
                        "source": {
                            "type": "appstore",
                            "name": app_name,
                            "app_key": app_key,
                            "url": f"https://apps.apple.com/kr/app/id{app_id}"
                        },
                        # App Store는 고유 ID를 제공하지 않으므로 조합해서 생성
                        "external_id": f"{app_id}_{review['userName']}_{review['date'].timestamp()}",
                        "author": review['userName'],
                        "rating": review['rating'],
                        "text": f"{review.get('title', '')}\n{review['review']}",
                        "created_at": review['date'].isoformat() if review.get('date') else datetime.now().isoformat(),
                        "collected_at": datetime.now().isoformat(),
                        "metadata": {
                            "is_edited": review.get('isEdited', False)
                        }
                    }
                    results.append(item)
                
                logger.info(f"Collected {len(scraper.reviews)} reviews for {app_name}")
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error collecting App Store reviews for {app_name}: {e}")
                
        return results
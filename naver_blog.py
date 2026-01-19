import time
import uuid
import logging
import requests
from datetime import datetime
from typing import List, Dict, Any

from config import NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, SEARCH_KEYWORDS, COLLECTION_CONFIG
try:
    from .base import BaseCollector
except ImportError:
    from base import BaseCollector

logger = logging.getLogger(__name__)

class NaverBlogCollector(BaseCollector):
    """
    네이버 블로그 검색 수집
    - API: 네이버 검색 API (Blog)
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config or COLLECTION_CONFIG["naver_blog"])
        self.client_id = NAVER_CLIENT_ID
        self.client_secret = NAVER_CLIENT_SECRET
        self.api_url = "https://openapi.naver.com/v1/search/blog.json"

    def get_source_type(self) -> str:
        return "naver_blog"

    def collect(self) -> List[Dict[str, Any]]:
        if not self.client_id or not self.client_secret:
            logger.error("Naver API credentials are missing. Skipping collection.")
            return []
            
        results = []
        headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret
        }
        
        keywords = SEARCH_KEYWORDS.get("primary", []) + SEARCH_KEYWORDS.get("competitive", [])
        
        for keyword in keywords:
            logger.info(f"Collecting Naver Blog posts for keyword: {keyword}...")
            try:
                params = {
                    "query": keyword,
                    "display": self.config.get("display", 100),
                    "sort": self.config.get("sort", "date")
                }
                
                response = requests.get(self.api_url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                for item in data.get("items", []):
                    # HTML 태그 제거 (간단히)
                    clean_title = item["title"].replace("<b>", "").replace("</b>", "").replace("&quot;", '"')
                    clean_desc = item["description"].replace("<b>", "").replace("</b>", "").replace("&quot;", '"')
                    
                    results.append({
                        "id": str(uuid.uuid4()),
                        "source": {
                            "type": "naver_blog",
                            "name": "Naver Blog",
                            "app_key": "naver_blog",
                            "url": item["link"]
                        },
                        "external_id": item["link"], # URL을 ID로 사용
                        "author": item["bloggername"],
                        "rating": None,
                        "text": f"{clean_title}\n{clean_desc}",
                        "created_at": self._parse_date(item["postdate"]),
                        "collected_at": datetime.now().isoformat(),
                        "metadata": {
                            "blogger_link": item["bloggerlink"]
                        }
                    })
                
                time.sleep(0.1) # API Rate limit 고려
                
            except Exception as e:
                logger.error(f"Error searching Naver Blog for {keyword}: {e}")
                
        return results

    def _parse_date(self, date_str: str) -> str:
        # YYYYMMDD format -> ISO format
        try:
            dt = datetime.strptime(date_str, "%Y%m%d")
            return dt.isoformat()
        except:
            return datetime.now().isoformat()
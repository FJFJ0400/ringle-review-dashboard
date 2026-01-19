import time
import uuid
import logging
import requests
from datetime import datetime
from typing import List, Dict, Any
from bs4 import BeautifulSoup

from config import SEARCH_KEYWORDS, COLLECTION_CONFIG
try:
    from .base import BaseCollector
except ImportError:
    from base import BaseCollector

logger = logging.getLogger(__name__)

class BrunchCollector(BaseCollector):
    """
    브런치 검색 수집
    - 방법: 웹 스크래핑
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config or COLLECTION_CONFIG["brunch"])
        self.base_url = "https://brunch.co.kr/search"

    def get_source_type(self) -> str:
        return "brunch"

    def collect(self) -> List[Dict[str, Any]]:
        results = []
        keywords = SEARCH_KEYWORDS.get("primary", []) + SEARCH_KEYWORDS.get("competitive", [])
        
        for keyword in keywords:
            logger.info(f"Collecting Brunch articles for keyword: {keyword}...")
            try:
                # 브런치 검색 페이지 요청
                params = {"q": keyword}
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
                response = requests.get(self.base_url, params=params, headers=headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 검색 결과 파싱 (브런치 구조에 맞춤)
                articles = soup.select("ul.list_article > li")
                
                count = 0
                max_count = self.config.get("max_articles", 50)
                
                for article in articles:
                    if count >= max_count:
                        break
                        
                    link_tag = article.select_one("a.link_post")
                    if not link_tag:
                        continue
                        
                    url = "https://brunch.co.kr" + link_tag["href"]
                    
                    title_tag = article.select_one("strong.tit_subject")
                    title = title_tag.text.strip() if title_tag else ""
                    
                    desc_tag = article.select_one("p.desc_article")
                    summary = desc_tag.text.strip() if desc_tag else ""
                    
                    author_tag = article.select_one("span.name_txt")
                    author = author_tag.text.strip() if author_tag else ""
                    
                    date_tag = article.select_one("span.time_txt")
                    date_str = date_tag.text.strip() if date_tag else ""
                    
                    results.append({
                        "id": str(uuid.uuid4()),
                        "source": {
                            "type": "brunch",
                            "name": "Brunch",
                            "app_key": "brunch",
                            "url": url
                        },
                        "external_id": url,
                        "author": author,
                        "rating": None,
                        "text": f"{title}\n{summary}",
                        "created_at": self._parse_date(date_str),
                        "collected_at": datetime.now().isoformat(),
                        "metadata": {}
                    })
                    count += 1
                
                time.sleep(2) # 요청 간 대기 (매너)
                
            except Exception as e:
                logger.error(f"Error scraping Brunch for {keyword}: {e}")
                
        return results

    def _parse_date(self, date_str: str) -> str:
        # 브런치 날짜 형식 처리 (예: '1시간 전', '2024.01.01', 'Dec 23. 2023')
        try:
            if '.' in date_str and len(date_str.split('.')) == 3:
                dt = datetime.strptime(date_str, "%Y.%m.%d")
                return dt.isoformat()
        except:
            pass
        # 파싱 실패 시 현재 시간 반환
        return datetime.now().isoformat()
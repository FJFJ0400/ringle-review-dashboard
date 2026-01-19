from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseCollector(ABC):
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    @abstractmethod
    def collect(self) -> List[Dict[str, Any]]:
        """수집 실행, RawItem 리스트 반환"""
        pass
    
    @abstractmethod
    def get_source_type(self) -> str:
        """소스 타입 반환"""
        pass

from .playstore import PlayStoreCollector
from .appstore import AppStoreCollector
from .youtube import YouTubeCollector
from .naver_blog import NaverBlogCollector
from .brunch import BrunchCollector
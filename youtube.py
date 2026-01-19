import time
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from config import YOUTUBE_API_KEY, YOUTUBE_CHANNELS, SEARCH_KEYWORDS, COLLECTION_CONFIG
try:
    from .base import BaseCollector
except ImportError:
    from base import BaseCollector

logger = logging.getLogger(__name__)

class YouTubeCollector(BaseCollector):
    """
    YouTube 댓글 수집
    - API: YouTube Data API v3
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config or COLLECTION_CONFIG["youtube"])
        self.api_key = YOUTUBE_API_KEY
        self.youtube = None
        if self.api_key:
            try:
                self.youtube = build('youtube', 'v3', developerKey=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize YouTube API client: {e}")
        else:
            logger.warning("YouTube API Key is missing.")

    def get_source_type(self) -> str:
        return "youtube"

    def collect(self) -> List[Dict[str, Any]]:
        if not self.youtube:
            logger.error("YouTube API client is not initialized. Skipping collection.")
            return []
            
        results = []
        
        # 1. 공식 채널 영상 댓글 수집
        for channel_name, channel_id in YOUTUBE_CHANNELS.items():
            logger.info(f"Collecting YouTube comments for channel: {channel_name}...")
            video_ids = self._get_channel_videos(channel_id)
            for video_id in video_ids:
                comments = self._get_video_comments(video_id)
                results.extend(comments)
                
        # 2. 키워드 검색 영상 댓글 수집
        keywords = SEARCH_KEYWORDS.get("primary", []) + SEARCH_KEYWORDS.get("competitive", [])
        for keyword in keywords:
            logger.info(f"Collecting YouTube comments for keyword: {keyword}...")
            video_ids = self._search_videos(keyword)
            for video_id in video_ids:
                comments = self._get_video_comments(video_id, keyword_context=keyword)
                results.extend(comments)
                
        return results

    def _get_channel_videos(self, channel_id: str) -> List[str]:
        """채널의 최신 동영상 ID 목록 조회"""
        video_ids = []
        try:
            request = self.youtube.search().list(
                part="id",
                channelId=channel_id,
                maxResults=self.config.get("max_videos_per_search", 10),
                order="date",
                type="video"
            )
            response = request.execute()
            for item in response.get("items", []):
                video_ids.append(item["id"]["videoId"])
        except HttpError as e:
            logger.error(f"Error getting channel videos: {e}")
        return video_ids

    def _search_videos(self, keyword: str) -> List[str]:
        """키워드로 동영상 검색"""
        video_ids = []
        try:
            request = self.youtube.search().list(
                part="id",
                q=keyword,
                maxResults=self.config.get("max_videos_per_search", 5),
                order="relevance",
                type="video"
            )
            response = request.execute()
            for item in response.get("items", []):
                video_ids.append(item["id"]["videoId"])
        except HttpError as e:
            logger.error(f"Error searching videos: {e}")
        return video_ids

    def _get_video_comments(self, video_id: str, keyword_context: str = None) -> List[Dict[str, Any]]:
        """동영상 댓글 수집"""
        comments = []
        try:
            request = self.youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=self.config.get("max_results_per_video", 20),
                textFormat="plainText"
            )
            response = request.execute()
            
            for item in response.get("items", []):
                snippet = item["snippet"]["topLevelComment"]["snippet"]
                comment_text = snippet["textDisplay"]
                
                comments.append({
                    "id": str(uuid.uuid4()),
                    "source": {
                        "type": "youtube",
                        "name": "YouTube",
                        "app_key": "youtube", # 일반적인 유튜브 소스로 분류
                        "url": f"https://www.youtube.com/watch?v={video_id}&lc={item['id']}"
                    },
                    "external_id": item["id"],
                    "author": snippet["authorDisplayName"],
                    "rating": None, # 유튜브 댓글은 평점이 없음
                    "text": comment_text,
                    "created_at": snippet["publishedAt"],
                    "collected_at": datetime.now().isoformat(),
                    "metadata": {
                        "thumbs_up": snippet["likeCount"],
                        "reply_count": item["snippet"]["totalReplyCount"],
                        "video_id": video_id,
                        "keyword_context": keyword_context
                    }
                })
        except HttpError as e:
            logger.warning(f"Error getting comments for video {video_id}: {e}") # 댓글 사용 중지된 영상 등
        return comments
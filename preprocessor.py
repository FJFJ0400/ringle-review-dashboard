import re
from typing import List, Tuple

class TextPreprocessor:
    """텍스트 정제 및 전처리"""
    
    def clean(self, text: str) -> str:
        """
        - URL 제거 또는 [링크]로 치환
        - 연속 공백/줄바꿈 정리
        - 이모지는 감성 분석을 위해 보존
        """
        if not text:
            return ""
            
        # URL 치환
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '[링크]', text)
        
        # 연속된 공백/줄바꿈을 단일 공백으로
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def detect_language(self, text: str) -> str:
        """언어 감지 (ko/en/other) - 간단한 휴리스틱"""
        if not text:
            return "other"
            
        # 한글 비중 계산
        ko_chars = len(re.findall(r'[가-힣]', text))
        total_chars = len(re.sub(r'\s', '', text))
        
        if total_chars == 0:
            return "other"
            
        if ko_chars / total_chars > 0.1: # 10% 이상이면 한국어로 간주
            return "ko"
            
        # 영문 비중
        en_chars = len(re.findall(r'[a-zA-Z]', text))
        if en_chars / total_chars > 0.5:
            return "en"
            
        return "other"
    
    def is_spam(self, text: str) -> Tuple[bool, str]:
        """
        스팸 여부 판단
        반환: (is_spam, reason)
        """
        if not text or len(text) < 5:
            return True, "too_short"
            
        # 반복 문자 체크 (예: ㅋㅋㅋㅋㅋ...)
        if re.search(r'(.)\1{9,}', text):
            return True, "repetitive_chars"
            
        # 광고 키워드 (예시)
        spam_keywords = ["광고", "홍보", "http", "카톡", "상담", "사다리", "토토"]
        for kw in spam_keywords:
            if kw in text:
                return True, "spam_keyword"
        
        return False, ""
    
    def split_utterances(self, text: str) -> List[str]:
        """
        문장 단위 분리
        """
        if not text:
            return []
            
        # 문장 종결 부호로 분리 (. ? !)
        sentences = re.split(r'(?<=[.?!])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
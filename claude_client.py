import os
import json
import logging
try:
    import anthropic
except ImportError:
    anthropic = None

logger = logging.getLogger(__name__)

class ClaudeAnalyzer:
    def __init__(self):
        self.api_key = os.environ.get("CLAUDE_API_KEY")
        self.client = None
        
        if not self.api_key:
            logger.warning("CLAUDE_API_KEY not found in environment variables.")
            return
            
        if anthropic:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        else:
            logger.warning("anthropic package is not installed.")

    def analyze(self, item):
        """
        리뷰 데이터를 받아 Claude API로 분석 수행
        """
        if not self.client:
            return None

        text = item.get("text", "")
        if not text:
            return None

        prompt = f"""
        Analyze the following review for Ringle (English tutoring service).
        Review: "{text}"
        
        Output JSON only with these fields:
        - sentiment: "positive", "neutral", or "negative"
        - problem_type: One of ["Audio Quality", "App Stability", "Tutor Matching", "Pricing", "UI/UX", "Curriculum"] or null if positive/neutral.
        - key_phrases: List of 1-3 key phrases (Korean or English).
        - churn_signal: boolean (true if user indicates quitting).
        - churn_keywords: List of keywords indicating churn (e.g., "refund", "cancel").
        """

        try:
            message = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=300,
                temperature=0,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            response_text = message.content[0].text
            # JSON 파싱 시도
            return json.loads(response_text)
        except Exception as e:
            logger.error(f"Error analyzing review {item.get('id')}: {e}")
            return None
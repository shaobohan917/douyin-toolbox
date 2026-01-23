"""
抖音视频内容总结技能模块

提供多维度分析功能，包括：
- 关键词提取
- 标签分类
- 情感倾向分析
- 内容分类
- 主题识别
- 内容总结
"""

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class VideoAnalysisResult:
    """视频分析结果数据结构"""
    video_id: str
    title: str
    analysis: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)


class DouyinVideoSummarizer:
    """抖音视频内容总结器"""

    # 内容分类映射
    CATEGORIES = {
        "金融投资": ["白银", "沪银", "lof", "基金", "股票", "投资", "大宗商品", "沪铜", "期货", "交易"],
        "科技数码": ["手机", "电脑", "软件", "AI", "人工智能", "科技", "数码"],
        "生活娱乐": ["美食", "旅游", "健身", "娱乐", "搞笑", "生活"],
        "教育知识": ["教程", "学习", "知识", "教育", "科普"],
        "时尚美妆": ["美妆", "时尚", "穿搭", "护肤"],
        "汽车": ["汽车", "车", "驾驶"],
        "体育": ["运动", "体育", "健身", "篮球", "足球"],
    }

    # 情感关键词
    SENTIMENT_KEYWORDS = {
        "positive": ["好", "棒", "优秀", "成功", "突破", "上涨", "利好", "推荐"],
        "negative": ["差", "失败", "下跌", "利空", "风险", "惊魂", "暴跌", "惨"],
        "neutral": ["分析", "介绍", "说明", "展示", "分享"]
    }

    def __init__(self, config_path: Optional[str] = None):
        """初始化视频总结器

        Args:
            config_path: 配置文件路径，默认为 skills/config/skills_config.yaml
        """
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """加载配置文件"""
        try:
            import yaml
            if config_path is None:
                config_path = Path(__file__).parent.parent / "config" / "skills_config.yaml"
            else:
                config_path = Path(config_path)

            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    return yaml.safe_load(f) or {}
        except ImportError:
            # PyYAML 不可用，使用默认配置
            pass
        except Exception:
            # 配置文件加载失败，使用默认配置
            pass
        return {}

    def _extract_tags(self, title: str) -> List[str]:
        """从标题中提取标签"""
        # 匹配 #标签 格式
        tags = re.findall(r'#([^#\s]+)', title)
        return tags

    def _extract_keywords(self, title: str, tags: List[str]) -> List[str]:
        """提取关键词"""
        keywords = []

        # 从标签中提取关键词（去掉#号）
        keywords.extend(tags)

        # 从标题中提取其他关键词（排除常见停用词）
        stop_words = {"的", "了", "是", "在", "和", "与", "或", "但", "这", "那", "！", "：", "，", "。"}
        words = re.findall(r'[\u4e00-\u9fa5a-zA-Z0-9]{2,}', title)
        for word in words:
            if word not in stop_words and word not in keywords:
                keywords.append(word)

        return keywords[:10]  # 限制关键词数量

    def _classify_category(self, keywords: List[str]) -> str:
        """分类内容类别"""
        for category, category_keywords in self.CATEGORIES.items():
            for keyword in keywords:
                if keyword.lower() in [ck.lower() for ck in category_keywords]:
                    return category
        return "其他"

    def _analyze_sentiment(self, title: str) -> str:
        """分析情感倾向"""
        for sentiment, keywords in self.SENTIMENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in title:
                    return sentiment
        return "neutral"

    def _identify_themes(self, keywords: List[str], category: str) -> List[str]:
        """识别主题"""
        themes = [category]

        # 根据关键词添加更具体的主题
        theme_mapping = {
            "白银": ["贵金属", "有色金属"],
            "沪银": ["期货", "上海期货交易所"],
            "lof": ["基金", "LOF基金"],
            "大宗商品": ["投资", "商品交易"],
            "沪铜": ["铜", "有色金属"],
        }

        for keyword in keywords:
            if keyword in theme_mapping:
                for theme in theme_mapping[keyword]:
                    if theme not in themes:
                        themes.append(theme)

        return themes[:5]  # 限制主题数量

    def _generate_summary(self, title: str, category: str, keywords: List[str]) -> str:
        """生成内容总结"""
        # 基于标题和分类生成简洁总结
        summary_parts = []

        # 提取关键信息
        if "振幅" in title or "波动" in title:
            amplitude_match = re.search(r'振幅(\d+%)', title)
            if amplitude_match:
                summary_parts.append(f"振幅达{amplitude_match.group(1)}")

        if "反转" in title or "突变" in title:
            summary_parts.append("出现反转走势")

        # 添加类别描述
        category_desc = {
            "金融投资": "投资分析",
            "科技数码": "科技产品",
            "生活娱乐": "生活娱乐",
            "教育知识": "知识科普",
            "时尚美妆": "时尚美妆",
            "汽车": "汽车相关",
            "体育": "体育运动",
        }.get(category, "相关内容")

        summary_parts.append(f"这是一个{category_desc}视频")

        # 添加主要关键词
        if keywords:
            main_keywords = keywords[:3]
            summary_parts.append(f"主要涉及{', '.join(main_keywords)}")

        return "，".join(summary_parts) + "。"

    def _extract_key_insights(self, title: str, keywords: List[str]) -> List[str]:
        """提取关键要点"""
        insights = []

        # 提取数值信息
        numbers = re.findall(r'\d+%', title)
        if numbers:
            insights.append(f"关键数据：{', '.join(numbers)}")

        # 提取情绪词
        if "惊魂" in title or "暴跌" in title:
            insights.append("市场波动剧烈")
        elif "突破" in title or "上涨" in title:
            insights.append("表现积极")

        # 提取投资相关要点
        if any(kw in keywords for kw in ["白银", "沪银", "lof", "基金", "投资"]):
            insights.append("涉及金融投资领域")

        if not insights:
            insights.append("内容主题明确，值得关注")

        return insights[:5]

    def analyze(
        self,
        video_id: str,
        title: str,
        tags: Optional[List[str]] = None,
        audio_text: Optional[str] = None
    ) -> VideoAnalysisResult:
        """分析抖音视频内容

        Args:
            video_id: 视频ID
            title: 视频标题
            tags: 视频标签列表（可选，如果不提供会从标题中提取）
            audio_text: 视频语音转文字内容（可选）

        Returns:
            VideoAnalysisResult: 分析结果对象
        """
        # 提取标签
        if tags is None:
            tags = self._extract_tags(title)

        # 提取关键词
        keywords = self._extract_keywords(title, tags)

        # 分类
        category = self._classify_category(keywords)

        # 情感分析
        sentiment = self._analyze_sentiment(title)

        # 主题识别
        themes = self._identify_themes(keywords, category)

        # 生成总结
        content_summary = self._generate_summary(title, category, keywords)

        # 提取关键要点
        key_insights = self._extract_key_insights(title, keywords)

        # 构建分析结果
        analysis = {
            "keywords": keywords,
            "tags": tags,
            "sentiment": sentiment,
            "category": category,
            "themes": themes,
            "content_summary": content_summary,
            "key_insights": key_insights,
        }

        # 如果有语音转文字内容，添加到分析中
        if audio_text:
            analysis["audio_text"] = audio_text
            analysis["has_audio"] = True
        else:
            analysis["has_audio"] = False

        return VideoAnalysisResult(
            video_id=video_id,
            title=title,
            analysis=analysis
        )

    def analyze_from_dict(self, data: Dict[str, Any]) -> VideoAnalysisResult:
        """从字典数据进行分析

        Args:
            data: 包含视频信息的字典，应包含 video_id 和 title 字段

        Returns:
            VideoAnalysisResult: 分析结果对象
        """
        return self.analyze(
            video_id=data.get("video_id", ""),
            title=data.get("title", ""),
            tags=data.get("tags"),
            audio_text=data.get("audio_text")
        )


# 便捷函数
def analyze_video(
    video_id: str,
    title: str,
    tags: Optional[List[str]] = None,
    audio_text: Optional[str] = None
) -> VideoAnalysisResult:
    """便捷函数：分析抖音视频

    Args:
        video_id: 视频ID
        title: 视频标题
        tags: 视频标签列表（可选）
        audio_text: 视频语音转文字内容（可选）

    Returns:
        VideoAnalysisResult: 分析结果对象
    """
    summarizer = DouyinVideoSummarizer()
    return summarizer.analyze(video_id, title, tags, audio_text)


if __name__ == "__main__":
    # 测试示例
    test_data = {
        "video_id": "7598451570845420834",
        "title": "白银lof：惊魂反转！振幅14%！ #大宗商品 #白银 #沪银 #白银lof #沪铜"
    }

    result = analyze_video(**test_data)
    print(result.to_json())
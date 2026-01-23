"""
Skills - 可重用技能库

这是一个可扩展的技能库系统，用于存放和管理各种可重复使用的技能和 prompt 模板。
"""

__version__ = "1.0.0"
__author__ = "iFlow CLI"

from skills.douyin.video_summarizer import (
    DouyinVideoSummarizer,
    VideoAnalysisResult,
    analyze_video
)

__all__ = [
    "DouyinVideoSummarizer",
    "VideoAnalysisResult",
    "analyze_video"
]
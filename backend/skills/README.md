# Skills - 可重用技能库

这是一个可扩展的技能库系统，用于存放和管理各种可重复使用的技能和 prompt 模板。

## 目录结构

```
skills/
├── README.md                      # 使用说明文档
├── douyin/                        # 抖音相关技能
│   ├── video_summarizer.py        # 视频内容分析模块
│   └── prompts/
│       └── video_summary.md       # 视频分析 prompt 模板
└── config/
    └── skills_config.yaml         # Skills 全局配置
```

## 当前技能

### 1. 抖音视频内容分析 (DouyinVideoSummarizer)

提供多维度分析功能，包括：
- 关键词提取
- 标签分类
- 情感倾向分析
- 内容分类
- 主题识别
- 内容总结

#### 使用方法

**基础用法：**

```python
from skills.douyin.video_summarizer import analyze_video

result = analyze_video(
    video_id="7598451570845420834",
    title="白银lof：惊魂反转！振幅14%！ #大宗商品 #白银 #沪银 #白银lof #沪铜"
)

# 输出 JSON 格式结果
print(result.to_json())

# 获取字典格式
data = result.to_dict()
```

**高级用法：**

```python
from skills.douyin.video_summarizer import DouyinVideoSummarizer

# 创建分析器实例
summarizer = DouyinVideoSummarizer()

# 分析视频
result = summarizer.analyze(
    video_id="7598451570845420834",
    title="白银lof：惊魂反转！振幅14%！ #大宗商品 #白银 #沪银 #白银lof #沪铜",
    tags=["大宗商品", "白银", "沪银"],  # 可选：提供标签
    audio_text="这是视频的语音转文字内容"  # 可选：提供语音文字
)

# 访问分析结果
print(f"分类: {result.analysis['category']}")
print(f"情感: {result.analysis['sentiment']}")
print(f"关键词: {result.analysis['keywords']}")
print(f"主题: {result.analysis['themes']}")
print(f"总结: {result.analysis['content_summary']}")
```

**从字典数据分析：**

```python
video_data = {
    "video_id": "7598451570845420834",
    "title": "白银lof：惊魂反转！振幅14%！ #大宗商品 #白银 #沪银 #白银lof #沪铜"
}

result = summarizer.analyze_from_dict(video_data)
```

#### 输出格式

```json
{
  "video_id": "7598451570845420834",
  "title": "白银lof：惊魂反转！振幅14%！ #大宗商品 #白银 #沪银 #白银lof #沪铜",
  "analysis": {
    "keywords": ["白银", "lof", "惊魂", "反转", "振幅14%", "大宗商品", "沪银", "沪铜"],
    "tags": ["大宗商品", "白银", "沪银", "白银lof", "沪铜"],
    "sentiment": "negative",
    "category": "金融投资",
    "themes": ["金融投资", "贵金属", "有色金属", "基金", "LOF基金"],
    "content_summary": "振幅达14%，出现反转走势，这是一个投资分析视频，主要涉及白银, lof, 惊魂。",
    "key_insights": [
      "关键数据：14%",
      "市场波动剧烈",
      "涉及金融投资领域"
    ],
    "has_audio": false
  }
}
```

## 配置说明

配置文件位于 `skills/config/skills_config.yaml`，可以自定义以下内容：

### 关键词提取配置

```yaml
douyin:
  video_summarizer:
    keywords:
      max_count: 10  # 最大关键词数量
      min_length: 2  # 关键词最小长度
```

### 内容分类配置

可以在配置文件中添加或修改分类和关键词：

```yaml
categories:
  新分类:
    - 关键词1
    - 关键词2
```

### 情感分析配置

可以添加或修改情感关键词：

```yaml
sentiment:
  positive:
    - 新正面词
  negative:
    - 新负面词
```

## 添加新技能

### 1. 创建技能目录

在 `skills/` 下创建新的技能目录：

```bash
mkdir -p skills/your_skill/prompts
```

### 2. 实现技能模块

创建 `skills/your_skill/your_module.py`：

```python
"""
你的技能模块描述
"""

from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class YourResult:
    """结果数据结构"""
    data: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return self.data


class YourSkill:
    """你的技能类"""

    def __init__(self, config_path: str = None):
        """初始化"""
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """加载配置"""
        # 实现配置加载逻辑
        return {}

    def execute(self, input_data: Any) -> YourResult:
        """执行技能"""
        # 实现技能逻辑
        return YourResult(data={})
```

### 3. 创建 Prompt 模板

创建 `skills/your_skill/prompts/your_prompt.md`：

```markdown
# 你的技能 Prompt 模板

## 角色定义
...

## 分析任务
...

## 输出格式
...
```

### 4. 更新配置

在 `skills/config/skills_config.yaml` 中添加你的技能配置：

```yaml
your_skill:
  your_module:
    # 你的配置项
```

### 5. 更新文档

在 `skills/README.md` 中添加你的技能说明。

## 测试

运行测试示例：

```bash
cd /Users/luka/Documents/Project/skills/douyin
python video_summarizer.py
```

## 依赖要求

- Python 3.7+
- PyYAML (用于配置文件解析)

安装依赖：

```bash
pip install pyyaml
```

## 扩展建议

1. **添加更多技能**：文本分析、数据可视化、图像处理等
2. **集成 LLM**：使用大语言模型进行更深入的分析
3. **缓存机制**：添加结果缓存以提高性能
4. **API 接口**：提供 REST API 接口供外部调用
5. **Web 界面**：创建 Web 界面方便使用

## 注意事项

1. **配置管理**：修改配置后需要重启程序才能生效
2. **性能优化**：大批量处理时建议使用缓存
3. **错误处理**：建议在生产环境中添加完善的错误处理
4. **日志记录**：使用日志记录重要操作和错误信息

## 贡献指南

欢迎提交新的技能和改进建议：

1. Fork 本项目
2. 创建新的技能目录
3. 实现技能模块和文档
4. 提交 Pull Request

## 许可证

本项目仅供学习和研究使用。

---

**Skills** - 让技能可重用，让效率倍增！
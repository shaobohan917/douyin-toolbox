import asyncio
import json
import re
import httpx
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

app_state = {"tools": [], "resources": [], "prompts": []}


@asynccontextmanager
async def lifespan(app: FastAPI):
    app_state["tools"] = [
        {
            "name": "parse_douyin_video",
            "description": "Parse a Douyin share URL and extract video information including watermark-free download link",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Douyin share URL (e.g., https://v.douyin.com/xxx or https://www.douyin.com/video/xxx)",
                    }
                },
                "required": ["url"],
            },
        },
        {
            "name": "get_video_download_url",
            "description": "Get the watermark-free download URL for a Douyin video",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "video_id": {"type": "string", "description": "Douyin video ID"}
                },
                "required": ["video_id"],
            },
        },
        {
            "name": "extract_video_id",
            "description": "Extract video ID from a Douyin share URL",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "Douyin share URL"}
                },
                "required": ["url"],
            },
        },
        {
            "name": "search_douyin_videos",
            "description": "Search for Douyin videos by keyword",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "Search keyword"},
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results (default: 10)",
                        "default": 10,
                    },
                },
                "required": ["keyword"],
            },
        },
        {
            "name": "get_user_videos",
            "description": "Get recent videos from a Douyin user",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "Douyin user ID or username",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of videos (default: 10)",
                        "default": 10,
                    },
                },
                "required": ["user_id"],
            },
        },
    ]
    app_state["resources"] = [
        {
            "uri": "douyin://video/info",
            "name": "Video Information",
            "description": "Schema for Douyin video information",
            "mimeType": "application/json",
        }
    ]
    app_state["prompts"] = [
        {
            "name": "video_summary",
            "description": "Generate a summary for a Douyin video",
            "arguments": [
                {
                    "name": "video_url",
                    "description": "URL of the Douyin video",
                    "required": True,
                }
            ],
        }
    ]
    yield


app = FastAPI(
    title="Douyin MCP Server",
    description="MCP Server for Douyin video parsing and extraction",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DouyinParser:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
        }
        self.base_url = "https://www.douyin.com"

    def extract_video_id(self, url: str) -> Optional[str]:
        patterns = [
            r"/video/(\d+)",
            r"/v/(\d+)",
            r"/share/video/(\d+)",
            r"douyin\.com/(\d+)",
            r"/note/(\d+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    def remove_watermark(self, url: str) -> str:
        if not url:
            return ""
        url = url.replace("v.douyin.com", "www.douyin.com")
        url = url.replace("/playwm/", "/play/")
        url = re.sub(r"&ratio=720p", "", url)
        return url

    async def parse_video(self, url: str) -> Dict[str, Any]:
        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError("Invalid Douyin URL")

        api_url = f"{self.base_url}/aweme/v1/web/aweme/detail/?aweme_id={video_id}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(api_url, headers=self.headers)
            response.raise_for_status()
            data = response.json()

        if not data or "aweme_detail" not in data:
            raise ValueError("Failed to fetch video data")

        aweme = data["aweme_detail"]
        video = aweme["video"]
        download_url = (
            self.remove_watermark(video["play_addr"]["url_list"][0])
            if video.get("play_addr", {}).get("url_list")
            else None
        )

        return {
            "success": True,
            "data": {
                "id": aweme.get("aweme_id", ""),
                "title": aweme.get("desc", ""),
                "cover": video.get("cover", {}).get("url_list", [{}])[0].get("url", "")
                if video.get("cover")
                else "",
                "duration": video.get("duration", 0),
                "author": {
                    "uid": aweme.get("author", {}).get("uid", ""),
                    "nickname": aweme.get("author", {}).get("nickname", ""),
                    "avatar": aweme.get("author", {})
                    .get("avatar_thumb", {})
                    .get("url_list", [{}])[0]
                    .get("url", "")
                    if aweme.get("author", {}).get("avatar_thumb")
                    else "",
                },
                "watermark_url": video.get("play_addr", {})
                .get("url_list", [{}])[0]
                .get("url", "")
                if video.get("play_addr")
                else "",
                "download_url": download_url,
                "play_url": video.get("play_addr", {})
                .get("url_list", [{}])[0]
                .get("url", "")
                if video.get("play_addr")
                else "",
                "create_time": aweme.get("create_time", 0),
                "statistics": {
                    "digg_count": aweme.get("statistics", {}).get("digg_count", 0),
                    "comment_count": aweme.get("statistics", {}).get(
                        "comment_count", 0
                    ),
                    "share_count": aweme.get("statistics", {}).get("share_count", 0),
                    "collect_count": aweme.get("statistics", {}).get(
                        "collect_count", 0
                    ),
                },
            },
        }

    async def get_download_url(self, video_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/aweme/v1/web/aweme/detail/?aweme_id={video_id}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()

        if not data or "aweme_detail" not in data:
            raise ValueError("Failed to fetch video data")

        video = data["aweme_detail"]["video"]
        url_list = video.get("play_addr", {}).get("url_list", [])
        if not url_list:
            raise ValueError("No download URL available")

        watermark_free = self.remove_watermark(url_list[0])

        return {
            "success": True,
            "data": {
                "video_id": video_id,
                "watermark_url": url_list[0],
                "download_url": watermark_free,
            },
        }


parser = DouyinParser()


class ParseRequest(BaseModel):
    url: str


class DownloadRequest(BaseModel):
    video_id: str


class ExtractRequest(BaseModel):
    url: str


class SearchRequest(BaseModel):
    keyword: str
    limit: int = 10


class UserVideosRequest(BaseModel):
    user_id: str
    limit: int = 10


@app.get("/")
async def root():
    return {
        "name": "Douyin MCP Server",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "parse": "/parse",
            "download": "/download",
            "extract_id": "/extract-id",
            "health": "/health",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "server": "douyin-mcp-server"}


@app.post("/parse")
async def parse_douyin_video(request: ParseRequest):
    try:
        result = await parser.parse_video(request.url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse video: {str(e)}")


@app.post("/download")
async def get_video_download_url(request: DownloadRequest):
    try:
        result = await parser.get_download_url(request.video_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get download URL: {str(e)}"
        )


@app.post("/extract-id")
async def extract_video_id(request: ExtractRequest):
    video_id = parser.extract_video_id(request.url)
    if video_id:
        return {"success": True, "data": {"video_id": video_id}}
    raise HTTPException(status_code=400, detail="Could not extract video ID from URL")


@app.get("/mcp/tools")
async def list_tools():
    return {"tools": app_state["tools"]}


@app.get("/mcp/resources")
async def list_resources():
    return {"resources": app_state["resources"]}


@app.get("/mcp/prompts")
async def list_prompts():
    return {"prompts": app_state["prompts"]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

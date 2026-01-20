#!/usr/bin/env python3
"""
Douyin MCP Server - FastAPI implementation for Douyin video parsing
"""

import os
import json
import re
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from bs4 import BeautifulSoup
import uvicorn

app = FastAPI(
    title="Douyin MCP Server",
    description="API for parsing Douyin videos and extracting content",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VideoParseRequest(BaseModel):
    url: str


class VideoParseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class TextExtractRequest(BaseModel):
    video_url: str
    api_key: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", version="1.0.0")


@app.post("/api/video/parse", response_model=VideoParseResponse)
async def parse_video(request: VideoParseRequest):
    """Parse a Douyin video URL and extract metadata"""
    try:
        video_id = extract_video_id(request.url)
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid Douyin URL")

        video_data = await fetch_video_data(video_id)

        return VideoParseResponse(
            success=True, message="Video parsed successfully", data=video_data
        )
    except Exception as e:
        return VideoParseResponse(success=False, message=str(e), data=None)


@app.post("/api/video/download-url")
async def get_download_url(request: VideoParseRequest):
    """Get watermark-free download URL"""
    try:
        video_id = extract_video_id(request.url)
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid Douyin URL")

        download_url = await get_watermark_free_url(video_id)

        return {
            "success": True,
            "message": "Download URL retrieved",
            "data": {"download_url": download_url, "video_id": video_id},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/video/text-extract")
async def extract_video_text(request: TextExtractRequest):
    """Extract text from video using speech recognition"""
    try:
        api_key = request.api_key or os.getenv("ALIYUN_API_KEY")
        if not api_key:
            raise HTTPException(status_code=400, detail="API key required")

        result = await call_aliyun_stt(api_key, request.video_url)

        return {
            "success": True,
            "message": "Text extracted successfully",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def extract_video_id(url: str) -> Optional[str]:
    """Extract video ID from Douyin URL"""
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


async def fetch_video_data(video_id: str) -> dict:
    """Fetch video metadata from Douyin API"""
    async with httpx.AsyncClient() as client:
        api_url = (
            f"https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id={video_id}"
        )

        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
            "Accept": "application/json",
        }

        response = await client.get(api_url, headers=headers, timeout=10.0)
        data = response.json()

        if not data.get("aweme_detail"):
            raise Exception("Failed to fetch video data")

        aweme = data["aweme_detail"]
        video = aweme["video"]

        return {
            "id": aweme["aweme_id"],
            "title": aweme["desc"],
            "cover": video["cover"]["url_list"][0] if video.get("cover") else None,
            "duration": video["duration"],
            "author": {
                "uid": aweme["author"]["uid"],
                "nickname": aweme["author"]["nickname"],
                "avatar": aweme["author"]["avatar_thumb"]["url_list"][0],
            },
            "watermark_url": video["play_addr"]["url_list"][0],
            "download_url": remove_watermark(video["play_addr"]["url_list"][0]),
            "play_url": video["play_addr"]["url_list"][0],
            "create_time": aweme["create_time"],
            "statistics": {
                "digg_count": aweme["statistics"]["digg_count"],
                "comment_count": aweme["statistics"]["comment_count"],
                "share_count": aweme["statistics"]["share_count"],
                "collect_count": aweme["statistics"]["collect_count"],
            },
        }


def remove_watermark(url: str) -> str:
    """Remove watermark from video URL"""
    url = url.replace("v.douyin.com", "www.douyin.com")
    url = url.replace("/playwm/", "/play/")
    url = url.replace("&ratio=720p", "")
    return url


async def get_watermark_free_url(video_id: str) -> str:
    """Get watermark-free download URL"""
    video_data = await fetch_video_data(video_id)
    return video_data["download_url"]


async def call_aliyun_stt(api_key: str, video_url: str) -> dict:
    """Call Alibaba Cloud STT API"""
    async with httpx.AsyncClient() as client:
        token_url = "https://bailian.console.aliyun.com/openapi/api/v2/tokens"

        token_response = await client.post(
            token_url,
            json={},
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10.0,
        )

        if token_response.status_code != 200:
            raise Exception("Failed to get access token")

        token_data = token_response.json()
        if "token" not in token_data:
            raise Exception("Invalid token response")

        token = token_data["token"]

        asr_url = "https://bailian.console.aliyun.com/openapi/api/v2/apps/app_id/asr"

        asr_response = await client.post(
            asr_url,
            json={"url": video_url, "format": "mp3", "language_hints": ["zh", "en"]},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=60.0,
        )

        if asr_response.status_code != 200:
            raise Exception("STT API call failed")

        return asr_response.json()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)

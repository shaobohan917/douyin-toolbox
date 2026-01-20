# Douyin Toolbox

A cross-platform app for parsing Douyin links, getting watermark-free video URLs, and extracting video text using AI.

## Features

- 🎬 Parse Douyin share URLs
- 🚫💧 Get watermark-free video download links
- 📝 Extract video text using speech recognition (AI)
- 💾 History management (local storage)
- 📋 Copy functionality
- 📤 Share functionality (WeChat sharing)

## Tech Stack

### Frontend
- **Uni-app** + **Vue3** + **uView Plus**
- Cross-platform: WeChat Mini Program, Android, iOS, H5

### Backend
- **Node.js Koa2** - REST API server
- **Python FastAPI** - MCP Server for Douyin parsing

### API
- **Alibaba Cloud Bailian (阿里云百炼)** - Speech-to-text

## Project Structure

```
douyin-toolbox/
├── backend/
│   ├── src/
│   │   ├── app.js           # Koa2 main entry
│   │   ├── routers/         # API routes
│   │   │   ├── video.js
│   │   │   ├── history.js
│   │   │   └── config.js
│   │   └── controllers/     # Route handlers
│   │       ├── video.js
│   │       ├── history.js
│   │       └── config.js
│   ├── douyin-mcp-server/
│   │   ├── server.py        # FastAPI MCP server
│   │   ├── package.json
│   │   └── requirements.txt
│   └── package.json
│
└── frontend/
    ├── pages/
    │   ├── index/           # Home page
    │   ├── history/         # History page
    │   └── settings/        # Settings page
    ├── api/                 # API utilities
    ├── utils/               # Helper functions
    ├── static/              # Static assets
    ├── App.vue
    ├── main.js
    ├── pages.json
    └── manifest.json
```

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.8+
- npm or yarn
- Alibaba Cloud Bailian API key

### Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
cd douyin-mcp-server
pip install -r requirements.txt
cd ../..

# Copy environment file
cp backend/.env.example backend/.env

# Edit .env and add your API key
# ALIYUN_API_KEY=sk-your-api-key

# Start the Node.js server
npm run dev

# In another terminal, start the MCP server
cd backend/douyin-mcp-server
python server.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev:h5        # H5
npm run dev:mp-weixin # WeChat Mini Program
npm run dev:app-plus  # App
```

## API Endpoints

### Video
- `POST /api/video/parse` - Parse Douyin URL
- `POST /api/video/download` - Get download URL
- `POST /api/video/speech-to-text` - Extract text from video

### History
- `GET /api/history` - Get history
- `POST /api/history` - Add to history
- `DELETE /api/history/:id` - Delete item
- `DELETE /api/history` - Clear all

### Config
- `GET /api/config` - Get config
- `POST /api/config` - Update config

## WeChat Mini Program

Configure in `frontend/manifest.json`:
```json
{
  "mp-weixin": {
    "appid": "wxb3b781beb80eb2f5"
  }
}
```

## Configuration

Set your Alibaba Cloud Bailian API key:
1. Get API key from [阿里云百炼](https://bailian.console.aliyun.com/)
2. Set in Settings page or `backend/.env`

## License

MIT License

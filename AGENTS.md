# Douyin Toolbox 项目上下文

## 项目概述

Douyin Toolbox 是一个跨平台应用，用于解析抖音分享链接、获取无水印视频下载链接，并使用 AI 进行视频文字提取（语音识别）。

### 主要功能
- 🎬 解析抖音分享链接
- 🚫💧 获取无水印视频下载链接
- 📝 使用语音识别 AI 提取视频文字
- 💾 历史记录管理（本地存储）
- 📋 复制功能
- 📤 分享功能（微信分享）

### 技术栈

#### 前端
- **实际部署**: 静态 HTML 文件（`frontend/index.html`）
- **框架**: Uni-app + Vue3 + uView Plus（`frontend/src/` 目录，当前未被使用）
- **跨平台支持**: 微信小程序、Android、iOS、H5
- **构建工具**: Vite

**⚠️ 重要说明**：
- 当前生产环境使用的是**静态 HTML 文件**（`frontend/index.html`），包含所有 HTML、CSS、JavaScript
- `frontend/src/` 目录包含 Uni-app + Vue3 源代码，但**当前未被使用**
- 修改前端时，应该修改 `frontend/index.html`，而不是 `frontend/src/pages/` 下的 Vue 文件
- `frontend/src/` 可能是早期开发保留的代码，或用于未来的跨平台支持（微信小程序、App）

#### 后端
- **API 服务**: Node.js Koa2
- **MCP 服务**: Python FastAPI (用于抖音解析)
- **AI 服务**: 阿里云百炼（语音识别）

#### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx

## 项目架构

```
douyin-toolbox/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── app.js             # Koa2 应用入口
│   │   ├── routers/           # API 路由
│   │   │   ├── video.js       # 视频相关路由
│   │   │   ├── history.js     # 历史记录路由
│   │   │   └── config.js      # 配置路由
│   │   ├── controllers/       # 路由处理器
│   │   │   ├── video.js       # 视频控制器
│   │   │   ├── history.js     # 历史控制器
│   │   │   └── config.js      # 配置控制器
│   │   ├── services/          # 业务逻辑层
│   │   │   ├── videoService.js # 视频服务
│   │   │   ├── historyService.js # 历史服务
│   │   │   ├── sttService.js   # 语音转文字服务
│   │   │   └── configService.js # 配置服务
│   │   ├── middleware/        # 中间件
│   │   │   ├── index.js       # 中间件集合（日志、错误处理、速率限制、验证、缓存）
│   │   ├── utils/             # 工具函数
│   │   │   ├── index.js       # 通用工具
│   │   │   └── videoHelper.js # 视频处理工具（统一视频ID提取、去水印、URL验证）
│   │   ├── config/            # 配置文件
│   │   └── data/              # 本地数据存储（历史记录、配置）
│   ├── douyin-mcp-server/     # MCP 服务（Python FastAPI）
│   │   ├── server.py          # FastAPI 服务入口
│   │   ├── package.json       # Python 依赖
│   │   └── requirements.txt   # Python 依赖列表
│   ├── package.json           # Node.js 依赖
│   └── .env                   # 环境变量配置（不提交到 git）
│
├── frontend/                   # 前端应用
│   ├── index.html             # ⚠️ 静态 HTML 文件（实际部署使用）
│   ├── src/                   # ⚠️ Uni-app + Vue3 源代码（当前未被使用）
│   │   ├── pages/             # 页面组件
│   │   │   ├── index/         # 首页（视频解析）
│   │   │   ├── history/       # 历史记录页
│   │   │   ├── settings/      # 设置页
│   │   │   └── result/        # 视频结果页
│   │   ├── api/               # API 调用封装
│   │   ├── utils/             # 工具函数
│   │   ├── static/            # 静态资源
│   │   │   ├── icons/         # 图标
│   │   │   └── images/        # 图片
│   │   ├── App.vue            # 根组件
│   │   ├── main.js            # 应用入口
│   │   ├── manifest.json       # 应用配置
│   │   ├── pages.json          # 页面路由配置
│   │   └── theme.json         # 主题配置
│   ├── nginx.conf              # Nginx 配置（Docker）
│   ├── vite.config.js          # Vite 配置
│   └── package.json           # Node.js 依赖
│
├── scripts/                    # 脚本工具
│   └── start-mcp.sh           # MCP 服务启动脚本
│
├── docker-compose.yml         # Docker 编排配置
├── Dockerfile.backend          # 后端 Docker 镜像
├── Dockerfile.frontend         # 前端 Docker 部署镜像
├── Dockerfile.mcp             # MCP 服务 Docker 镜像
├── README.md                   # 项目说明文档
├── DEPLOY.md                   # Docker 部署指南
└── package.json               # 根项目配置（启动脚本）
```

## 构建和运行

### 本地开发环境

#### 启动所有服务（推荐）
```bash
npm run dev
```
这会同时启动：
- 后端服务（端口 3000）
- 前端开发服务器（端口 8080）
- MCP 服务（端口 8001）

#### 单独启动服务
```bash
# 后端
npm run dev:backend

# 前端 H5
npm run dev:frontend

# MCP 服务
npm run dev:mcp

# 微信小程序
npm run dev:frontend:mp

# App
npm run dev:frontend:app
```

#### 停止所有服务
```bash
npm run stop
```

#### 查看服务状态
```bash
npm run status
```

### 生产环境部署

#### Docker 部署（推荐）
```bash
# 配置环境变量
vim .env

# 构建并启动
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f
```

#### 服务端口
| 服务 | 端口 | 访问地址 |
|------|------|----------|
| 前端 | 5001 | http://your-server:5001 |
| 后端 API | 5002 | http://your-server:5002/api/health |
| MCP 服务 | 5003 | HTTP: http://your-server:5003 |

## API 接口

### 视频相关
- `POST /api/video/parse` - 解析抖音 URL
- `POST /api/video/download` - 获取下载 URL
- `POST /api/video/speech-to-text` - 提取视频文字（需要配置 API Key）
- `GET /api/video/proxy-download` - 代理下载视频

### 历史记录
- `GET /api/history` - 获取历史记录
- `GET /api/history/stats` - 获取统计信息
- `POST /api/history` - 添加到历史
- `DELETE /api/history/:id` - 删除单条记录
- `DELETE /api/history` - 清空所有历史

### 配置
- `GET /api/config` - 获取配置
- `POST /api/config` - 更新配置

### 健康检查
- `GET /api/health` - 后端健康检查
- `GET /health` - MCP 服务健康检查（通过 Nginx 代理）

## 环境配置

### 必需环境变量
- `DASHSCOPE_ALLSCOPE_API_KEY` - 阿里云百炼 API Key（用于语音转文字）

### 可选环境变量
- `PORT` - 后端服务端口（默认 3000）
- `NODE_ENV` - 运行环境（development/production）
- `MCP_SERVER_URL` - MCP 服务 URL
- `CORS_ORIGIN` - CORS 允许的来源
- `VITE_API_URL` - 前端 API 地址

### 环境变量文件
创建 `.env` 文件（根目录和 `backend/` 目录）：
```bash
DASHSCOPE_API_KEY=sk-88552d68ff3340efbd221b64be8a3513
```

## 开发规范

### 代码结构
- 使用分层架构：Router → Controller → Service
- 统一使用工具函数：`backend/src/utils/videoHelper.js`
- 中间件定义在 `backend/src/middleware/index.js` 中

### API 设计
- 使用 RESTful 风格
- 统一响应格式：
  ```json
  {
    "success": true/false,
    "message": "操作结果描述",
    "data": {}
  }
  ```
- 统一错误处理中间件

### 性能优化
- 已添加速率限制（100 请求/分钟）
- 历史统计使用单次遍历优化
- 使用异步 API（避免阻塞）

### 安全性
- 已添加 URL 格式验证
- 已添加 API Key 验证（trim() 检查空字符串）
- CORS 配置支持环境变量
- 环境变量文件已加入 `.gitignore`

## 本地部署注意事项

### 端口配置
- 后端：3000（本地）/ 5002（Docker）
- 前端：8080（开发）/ 5001（Docker）
- MCP：8001（统一）

### 前端 API 代理
- 开发环境：Vite 代理到 `http://localhost:3000`
- 生产环境：Nginx 代理到后端容器

### MCP 服务启动
- 使用 `scripts/start-mcp.sh` 启动
- 自动检测 Python 环境（Python 3.8+ 或 3.10+）
- 端口固定为 8001

### 网络地址
- 本地环境使用 `0.0.0.0` 监听，支持远程访问
- 前端开发服务器使用实际 IP 地址（非 localhost）

## 常见问题

### 1. 视频解析失败
- 检查 URL 格式是否正确
- 检查 MCP 服务是否正常运行
- 查看后端日志排查错误

### 2. 语音转文字失败
- 检查是否配置了 `DASHSCOPE_API_KEY`
- 检查 API Key 是否有效（阿里云百炼控制台）
- 查看后端日志确认错误信息

### 3. 前端无法连接后端
- 检查后端服务是否启动
- 检查端口是否正确（3000/5002）
- 检查 CORS 配置

### 4. MCP 服务启动失败
- 检查 Python 版本（需要 3.8+）
- 检查是否安装了依赖：`pip install -r requirements.txt`
- 检查端口 8001 是否被占用

### 5. Docker 部署后数据丢失
- 当前配置无数据持久化
- 需在 `docker-compose.yml` 中添加数据卷挂载

## 项目记忆

### 用户配置
- DashScope API Key: `sk-88552d68ff3340efbd221b64be8a3513`（已保存到记忆）

### 构建规则
- 本地构建：`npm run dev`（前端 Vite、后端 nodemon、MCP uvicorn）
- 服务器构建：`docker compose up`

### 测试链接
- https://v.douyin.com/0jieQF5SAxg/

### 最近修复的问题（2026-01-23）
- ✅ 删除重复的 `/douyin-mcp-server` 目录
- ✅ 修复 MCP Server 端口配置（8000 → 8001）
- ✅ 修复 configService.js 语法错误
- ✅ 添加 API Key 验证（trim() 检查）
- ✅ 移除未使用的依赖（jsonwebtoken, js-base64）
- ✅ 统一视频 ID 提取和去水印逻辑（videoHelper.js）
- ✅ 修复硬编码的 localhost 引用
- ✅ 添加 URL 验证到路由
- ✅ 应用速率限制中间件
- ✅ 优化历史记录统计性能
- ✅ 添加 Vite 开发环境代理
- ✅ 删除空的 .backup 目录

### Git 提交历史
- 23379e5 - Refactor: Code quality improvements and bug fixes（最新）
- 68c304b - Refactor: Unify API key configuration to DASHSCOPE_API_KEY
- 5552475 - Configure DASHSCOPE_API_KEY environment variable
- f643769 - Add Douyin link extraction and support hyphens in short links
- fc61563 - Fix frontend API URL: use relative path for production deployment
- 0482eae - Fix server binding: listen on 0.0.0.0 for remote access; support VITE_API_URL env for frontend dev

## 技术债务

### 已修复（高优先级）
- ✅ 端口配置不一致问题
- ✅ configService.js 语法错误
- ✅ API Key 验证缺失
- ✅ 未使用的依赖
- ✅ 重复的代码逻辑

### 已修复（中优先级）
- ✅ 代码重复（视频ID提取、去水印）
- ✅ 硬编码 localhost 引用
- ✅ 错误处理不完善
- ✅ 性能问题（历史统计）
- ✅ 缺少输入验证和速率限制

### 待处理（低优先级）
- ⏳ 统一日志记录方式
- ⏳ 添加单元测试
- ⏳ 添加数据持久化配置
- ⏳ 优化 CORS 配置

## 贡献指南

### 提交规范
- 遵循 Conventional Commits 规范
- 提交信息格式：`<type>: <subject>`
- 类型：`feat`（新功能）、`fix`（修复）、`refactor`（重构）、`docs`（文档）、`test`（测试）

### 代码规范
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循现有代码风格
- 添加必要的注释

### 测试
- 为新功能添加单元测试
- 确保所有测试通过后再提交
- 测试命令：`npm test`

## 许可证

MIT License
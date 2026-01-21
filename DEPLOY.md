# Docker 部署指南

## 端口规划

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 H5 | 5001 | Nginx 静态资源服务 |
| 后端 API | 5002 | Koa2 REST API |
| MCP 服务 | 5003 | FastAPI MCP Server |

## 快速部署

### 1. 上传项目到服务器

```bash
git clone <your-repo-url>
cd douyin-toolbox
```

### 2. 配置环境变量

编辑 `.env` 文件，填入阿里云 API Key：

```bash
vim .env
```

### 3. 构建并启动

```bash
docker compose up -d --build
```

### 4. 查看服务状态

```bash
# 查看容器运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 查看实时资源使用
docker stats
```

## 服务访问

- **前端页面**: http://your-server:5001
- **后端健康检查**: http://your-server:5002/api/health
- **MCP 健康检查**: http://your-server:5003/health

## 常用命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重启单个服务
docker compose restart backend

# 更新部署
git pull
docker compose up -d --build

# 查看日志
docker compose logs -f --tail=100
```

## 故障排查

### 端口被占用
```bash
# 查看端口占用
netstat -tlnp | grep 500

# 或使用 lsof
lsof -i :5001
```

### 查看容器日志
```bash
# 查看所有日志
docker compose logs

# 查看指定服务日志
docker compose logs frontend
docker compose logs backend
docker compose logs mcp
```

### 进入容器调试
```bash
docker exec -it douyin-toolbox-backend sh
docker exec -it douyin-toolbox-mcp sh
```

## 数据持久化

当前配置暂无数据持久化，如需持久化历史记录，可添加：

```yaml
services:
  backend:
    volumes:
      - ./data:/app/data
```

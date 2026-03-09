# AI Reader 后端

基于 NestJS 的 AI 智库平台后端服务，提供认证、用户管理、热榜文章、订阅文章等功能。

## 功能概览

### P1 接口框架

| 模块 | 接口 | 说明 |
|------|------|------|
| **Auth** | `POST /api/auth/login` | 密码登录 |
| | `POST /api/auth/register` | 用户注册 |
| **User** | `GET /api/user/profile` | 获取用户信息（需登录） |
| | `PUT /api/user/keywords` | 更新订阅关键词 |
| | `POST /api/user/collect/:articleId` | 收藏文章 |
| | `DELETE /api/user/collect/:articleId` | 取消收藏 |
| **Articles** | `GET /api/articles/hot` | 热榜文章（公开） |
| | `POST /api/articles/subscribe` | 订阅关键词获取文章（需登录） |
| | `GET /api/articles/hot/sync` | 手动同步热榜 |

### P2 工作流

1. **定时热榜同步**：每日 6:00 调用第三方 API 获取掘金/知乎/CSDN 热榜，存入 MySQL 和 Milvus 向量库
2. **订阅关键词**：用户输入关键词 → 先查 Milvus 向量库 → 有则返回，无则调用第三方 API 获取

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 5.7+
- Milvus 2.6+（可选，用于向量搜索）

### 安装

```bash
pnpm install
```

### 配置

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

| 变量 | 说明 |
|------|------|
| `DB_*` | MySQL 数据库连接 |
| `JWT_SECRET` | JWT 签名密钥 |
| `MILVUS_ADDRESS` | Milvus 地址，默认 `localhost:19530` |
| `OPENAI_API_KEY` | OpenAI API Key，用于文章向量化 |

> 若不配置 Milvus 和 OpenAI，热榜仍可从第三方 API 获取，订阅文章将回退到关键词匹配热榜。

### 运行

```bash
# 开发模式
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

## API 示例

### 注册

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456","nickname":"测试用户"}'
```

### 登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

### 获取热榜（无需登录）

```bash
curl "http://localhost:3001/api/articles/hot?platform=稀土掘金"
```

### 订阅关键词获取文章（需 Bearer Token）

```bash
curl -X POST http://localhost:3001/api/articles/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"keyword":"AI"}'
```

## 项目结构

```
src/
├── entities/          # 数据库实体
├── modules/
│   ├── auth/          # 认证
│   ├── user/          # 用户
│   ├── article/       # 文章（热榜、订阅）
│   ├── vector/        # Milvus 向量服务
│   └── embedding/     # OpenAI 向量化
└── app.module.ts
```

## 权限说明

- **未登录**：仅可访问热榜页面和首页
- **已登录**：可查看具体文章、个人数据、订阅文章、收藏文章

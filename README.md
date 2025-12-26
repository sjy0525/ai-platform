# AI Platform

一款用户主权式的AI智库式技术平台

## 技术栈

- **前端框架**: React 19
- **开发语言**: TypeScript
- **构建工具**: Webpack 5
- **包管理器**: npm
- **样式支持**: CSS, LESS, SASS/SCSS
- **代码规范**: 基于TypeScript,ESLint+Prettier 配置

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

## 项目结构

```
ai-platform/
├── public/                 # 静态资源目录
│   └── index.html         # HTML 模板
├── src/                   # 源代码目录
│   ├── app/               # App 组件
│   ├── main.tsx           # 应用入口
│   └── main.css           # 全局样式
├── webpack.config.js      # Webpack 配置
├── tsconfig.json          # TypeScript 配置
├── package.json           # 项目依赖
└── README.md              # 项目文档
```


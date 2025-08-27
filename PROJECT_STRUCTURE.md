# 项目结构重构说明

## 新的目录结构

```
hilton/
├── backend/                 # 后端项目（独立部署）
│   ├── src/
│   │   ├── shared/         # 共享类型和工具（从原 packages/shared 复制）
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── ...
│   ├── package.json        # 后端依赖
│   └── Dockerfile
├── frontend/               # 前端项目（独立部署）
│   ├── src/
│   │   ├── shared/        # 共享类型和工具（从原 packages/shared 复制）
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json       # 前端依赖
│   └── Dockerfile
├── docker-compose.yml     # 生产环境
├── docker-compose.dev.yml # 开发环境
└── package.json          # 根目录脚本（可选）
```

## 主要变化

1. **移除了 monorepo 结构**：不再使用 `packages/` 目录和 npm workspaces
2. **独立的 node_modules**：backend 和 frontend 各自有独立的 node_modules
3. **共享代码复制**：将 shared 代码复制到两个项目中，便于独立部署
4. **更新了 Docker 配置**：修改了 docker-compose 文件中的路径

## 部署优势

- **独立部署**：backend 和 frontend 可以分别部署到不同的云服务
- **独立扩展**：可以根据需要独立扩展前端或后端
- **简化 CI/CD**：每个项目有独立的构建和部署流程
- **减少依赖冲突**：避免了 monorepo 中的依赖版本冲突

## 开发命令

### 根目录命令

```bash
npm run install:all      # 安装所有依赖
npm run build:all        # 构建所有项目
npm run dev              # 同时启动前后端开发服务器
```

### 单独项目命令

```bash
# 后端
cd backend
npm install
npm run dev
npm run build

# 前端
cd frontend
npm install
npm run dev
npm run build
```

### Docker 命令

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up

# 生产环境
docker-compose up
```

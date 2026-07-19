# 多多共享id

一个基于 Vite、React、Tailwind CSS 和 Cloudflare Pages Functions 的共享账号展示站点。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/beita59654/duoduo-shared-id/tree/main/app)

## 演示地址

https://id.duoduo.uk

## 本地开发

```bash
npm install
npm run dev
```

本地访问：

```text
http://localhost:5173
```

## 构建

```bash
npm run build
```

构建产物在 `dist/`，该目录不会提交到开源仓库。

## Cloudflare Pages 部署

首次登录：

```bash
npx wrangler login
```

从仓库根目录一键发布：

```bash
./deploy-cloudflare.sh
```

或者在 `app/` 目录发布：

```bash
npm run cf:release
```

发布脚本会自动检查登录状态、创建 Pages 项目、构建前端并上传到 Cloudflare Pages。

上面的 Deploy to Cloudflare 按钮会打开 Cloudflare 的部署向导。Cloudflare 官方按钮当前面向 Workers 应用；如果向导不适配 Pages，请使用本节脚本部署。

默认项目名是 `id-duoduo-uk`。如果要换项目名：

```bash
CLOUDFLARE_PAGES_PROJECT=你的项目名 npm run cf:release
```

## 目录结构

```text
src/                  前端页面和组件
functions/api/         Cloudflare Pages Functions API
functions/_lib/        账号数据解析和响应工具
scripts/               Cloudflare 发布辅助脚本
```

## 免责声明

本项目仅用于学习和测试 Cloudflare Pages、React 前端和公开数据解析流程。使用共享账号存在风险，请遵守相关服务条款和当地法律法规。

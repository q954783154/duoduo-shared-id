# 多多共享id

基于 React、Vite、Tailwind CSS 和 Cloudflare Pages Functions 的共享账号展示站点。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/beita59654/duoduo-shared-id/tree/main/app)

## 演示地址

https://id.duoduo.uk

## 快速开始

```bash
cd app
npm install
npm run dev
```

生产构建：

```bash
cd app
npm run build
```

## 一键部署到 Cloudflare Pages

首次使用先登录 Cloudflare：

```bash
cd app
npx wrangler login
```

之后在仓库根目录执行：

```bash
./deploy-cloudflare.sh
```

这个脚本会自动检查登录状态、创建 Pages 项目、构建前端并上传到 Cloudflare Pages。

上面的 Deploy to Cloudflare 按钮会打开 Cloudflare 的部署向导。Cloudflare 官方按钮当前面向 Workers 应用；如果向导不适配 Pages，请使用本节脚本部署。

默认项目名是 `id-duoduo-uk`。如果要换项目名：

```bash
CLOUDFLARE_PAGES_PROJECT=你的项目名 ./deploy-cloudflare.sh
```

## 项目结构

```text
app/                  前端和 Cloudflare Pages Functions
app/functions/api/    /api/accounts 与 /api/refresh
app/functions/_lib/   公开数据源解析、缓存响应工具
deploy-cloudflare.sh  一键创建并部署 Cloudflare Pages
api/                  可选的本地 Python API 开发服务
```

## 开源许可

MIT

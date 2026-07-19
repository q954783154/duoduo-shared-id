# Cloudflare 部署说明

这个项目已经改成适合 `Cloudflare Pages + Pages Functions` 的结构：

- 前端静态文件由 Vite 构建到 `dist/`
- 后端接口位于 `functions/api/accounts.ts` 和 `functions/api/refresh.ts`
- 前端直接请求同域 `/api/*`
- 已提供一键发布脚本

## 一键发布

首次使用先登录：

```bash
cd app
npx wrangler login
```

之后每次发布只需要二选一：

```bash
./deploy-cloudflare.sh
```

或者：

```bash
cd app
npm run cf:release
```

默认会：

1. 检查 Cloudflare 登录状态
2. 自动检查 `id-duoduo-uk` 项目是否存在，不存在就创建
3. 自动构建前端
4. 自动部署到 Cloudflare Pages

## 方式一：Cloudflare Pages 面板部署

1. 把 `app/` 目录作为一个独立项目上传到 Git 仓库。
2. 在 Cloudflare 后台创建 `Pages` 项目并连接仓库。
3. 构建配置填写：
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `app`
4. 首次部署完成后，访问分配到的 `*.pages.dev` 域名，或绑定自定义域名 `id.duoduo.uk`。

## 方式二：Wrangler 本地发布

先安装并登录：

```bash
npm install -g wrangler
wrangler login
```

在 `app/` 目录执行：

```bash
npm install
npm run build
wrangler pages project create id-duoduo-uk
npm run cf:deploy
```

## 本地预览

```bash
npm install
npm run build
npm run cf:dev
```

本地预览时，Pages Functions 也会一起生效，`/api/accounts` 和 `/api/refresh` 可以直接访问。

## 自动同步

开发时如果希望每次保存源码后自动构建并同步到 Cloudflare，可以保持下面命令运行：

```bash
npm run cf:watch
```

它会监听 `src/`、`functions/` 和主要配置文件，跳过 `dist/` 与 `node_modules/`。如果 Cloudflare 没登录，会按现有发布脚本提示先执行 `npx wrangler login`。

## 可选环境变量

如果你想换项目名或生产分支，可以在执行前指定：

```bash
CLOUDFLARE_PAGES_PROJECT=my-pages-name CLOUDFLARE_PAGES_BRANCH=main ./deploy-cloudflare.sh
```

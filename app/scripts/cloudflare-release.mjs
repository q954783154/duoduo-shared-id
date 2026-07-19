#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const projectName = process.env.CLOUDFLARE_PAGES_PROJECT || 'id-duoduo-uk';
const productionBranch = process.env.CLOUDFLARE_PAGES_BRANCH || 'main';
const compatibilityDate = process.env.CLOUDFLARE_COMPATIBILITY_DATE || '2026-04-07';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: options.capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    env: process.env,
  });

  if (options.capture) {
    return result;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result;
}

function parseJsonOutput(commandName, result) {
  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    if (stderr) {
      console.error(stderr);
    }
    process.exit(result.status ?? 1);
  }

  const stdout = result.stdout?.trim();
  if (!stdout) {
    console.error(`${commandName} 没有返回可解析的数据。`);
    process.exit(1);
  }

  try {
    return JSON.parse(stdout);
  } catch {
    console.error(`${commandName} 返回了非 JSON 输出：\n${stdout}`);
    process.exit(1);
  }
}

function ensureLogin() {
  const result = run(npxCommand, ['wrangler', 'whoami', '--json'], { capture: true });

  if (result.status !== 0) {
    console.error('Cloudflare 还没有登录。先执行一次 `cd app && npx wrangler login`。');
    const stderr = result.stderr?.trim();
    if (stderr) {
      console.error(stderr);
    }
    process.exit(result.status ?? 1);
  }

  const profile = parseJsonOutput('wrangler whoami', result);
  const email = profile.email || profile.login || '当前账号';
  console.log(`已登录 Cloudflare: ${email}`);
}

function ensureProject() {
  const result = run(npxCommand, ['wrangler', 'pages', 'project', 'list', '--json'], { capture: true });
  const projects = parseJsonOutput('wrangler pages project list', result);
  const exists =
    Array.isArray(projects) &&
    projects.some((project) => project?.name === projectName || project?.['Project Name'] === projectName);

  if (exists) {
    console.log(`Pages 项目已存在: ${projectName}`);
    return;
  }

  console.log(`正在创建 Pages 项目: ${projectName}`);
  run(npxCommand, [
    'wrangler',
    'pages',
    'project',
    'create',
    projectName,
    '--production-branch',
    productionBranch,
    '--compatibility-date',
    compatibilityDate,
  ]);
}

function buildApp() {
  console.log('正在构建前端...');
  run('npm', ['run', 'build']);
}

function deployApp() {
  console.log(`正在部署到 Cloudflare Pages: ${projectName}`);
  run(npxCommand, [
    'wrangler',
    'pages',
    'deploy',
    'dist',
    '--project-name',
    projectName,
    '--branch',
    productionBranch,
    '--commit-dirty',
    'true',
  ]);
}

ensureLogin();
ensureProject();
buildApp();
deployApp();

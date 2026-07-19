#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const watchTargets = ['src', 'functions', 'index.html', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js'];
const ignoredPathParts = new Set(['node_modules', 'dist', '.wrangler', '.git']);
const debounceMs = 1500;

let deployProcess = null;
let deployQueued = false;
let debounceTimer = null;

function shouldIgnore(filePath = '') {
  return filePath
    .split(path.sep)
    .some((part) => ignoredPathParts.has(part));
}

function runDeploy(reason) {
  if (deployProcess) {
    deployQueued = true;
    console.log(`检测到新改动，当前部署完成后会继续同步：${reason}`);
    return;
  }

  console.log(`开始同步到 Cloudflare：${reason}`);
  deployProcess = spawn('npm', ['run', 'cf:release'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  deployProcess.on('exit', (code) => {
    deployProcess = null;

    if (code === 0) {
      console.log('Cloudflare 同步完成。');
    } else {
      console.error(`Cloudflare 同步失败，退出码：${code ?? 'unknown'}`);
    }

    if (deployQueued) {
      deployQueued = false;
      runDeploy('队列中的最新改动');
    }
  });
}

function scheduleDeploy(reason) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runDeploy(reason), debounceMs);
}

for (const target of watchTargets) {
  const absoluteTarget = path.join(projectRoot, target);

  if (!fs.existsSync(absoluteTarget)) {
    continue;
  }

  fs.watch(absoluteTarget, { recursive: true }, (_eventType, filename) => {
    const changedPath = filename ? path.join(target, filename.toString()) : target;

    if (shouldIgnore(changedPath)) {
      return;
    }

    scheduleDeploy(changedPath);
  });
}

console.log('正在监听源码改动，保存后会自动构建并同步到 Cloudflare。');
console.log('按 Ctrl+C 停止监听。');

#!/usr/bin/env bash
# 以生产模式监听 0.0.0.0，供安全组 / 反向代理 / 隧道转发到公网。
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_ENV=production
export PORT="${PORT:-3999}"
if [[ ! -f dist/server.cjs || ! -f dist/index.html ]]; then
  npm run build
fi
exec node dist/server.cjs

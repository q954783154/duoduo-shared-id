#!/bin/zsh

set -euo pipefail

cd "$(dirname "$0")/app"
npm run cf:release

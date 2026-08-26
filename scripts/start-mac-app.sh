#!/bin/bash
# Khởi động HSK16 ở chế độ local và mở trình duyệt.
set -e

PROJECT_DIR="/Volumes/Project/hsk16"
PORT=3000
LOG_FILE="/tmp/hsk16-app.log"

cd "$PROJECT_DIR"

if ! lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  if [ ! -f ".next/BUILD_ID" ]; then
    rm -rf .next
    npm run build >> "$LOG_FILE" 2>&1
  fi
  nohup npm run start >> "$LOG_FILE" 2>&1 &
  disown

  for i in $(seq 1 30); do
    if curl -s -o /dev/null "http://localhost:$PORT"; then
      break
    fi
    sleep 1
  done
fi

open "http://localhost:$PORT"

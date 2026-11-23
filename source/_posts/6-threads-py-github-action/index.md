---
title: threads同步部落格自動發文 -- python + github action 實現
description: threads-py
date: 2026-01-04 12:00:00 +0800
tags:
  - threads
  - 教學
  - api
  - python
  - github action
  - github page
categories:
  - social media api
---
{% post_link 5-threads-py-teach '可參考上一篇教學學threads-py的用法' %}

## 第一步
建立一個 github action workflow 檔案 放在專案的`.github/workflows/auto-push-threads.yml`，內容如下：
```yml
# GitHub Action 工作流程：自動發佈到 Threads
name: Auto Push to Threads

# 觸發條件：當推送到 main 分支時執行
on:
  push:
    branches: [ main ]

# 定義工作任務
jobs:
  publish:
    # 運行環境：最新的 Ubuntu
    runs-on: ubuntu-latest
    steps:
      # 步驟 1: 檢出程式碼
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 取得完整歷史記錄，用於分析提交變更

      # 步驟 2: 設定 Python 環境
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      # 步驟 3: 設定 Node.js 環境
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      # 步驟 4: 快取 NPM 依賴以加速構建
      - name: Cache NPM dependencies
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.OS }}-npm-cache
          restore-keys: |
            ${{ runner.OS }}-npm-cache

      # 步驟 5: 安裝所有必要的依賴
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y jq
          python -m pip install --upgrade pip
          pip uninstall httpx -y
          pip install threads-py \
          -i https://test.pypi.org/simple \
          --extra-index-url https://pypi.org/simple
          pip install pandas
          npm install
          npm run build

      # 步驟 6: 獲取提交資訊和變更的檔案清單
      - name: Determine commit message and changed files
        id: vars
        run: |
          echo "GITHUB_EVENT_PATH: $GITHUB_EVENT_PATH"
          echo "=== event payload ==="
          jq . "$GITHUB_EVENT_PATH" || cat "$GITHUB_EVENT_PATH"

          # 取得提交訊息，若無則使用 git log
          COMMIT_MSG=$(jq -r '.head_commit.message // empty' "$GITHUB_EVENT_PATH")
          if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG=$(git log -1 --pretty=%B || echo "")
          fi

          # 取得新增的檔案清單（以空格分隔）
          ADDED=$(git diff-tree --no-commit-id --diff-filter=A --name-only -r HEAD | tr '\n' ' ')
          echo "DEBUG: Added files (one-per-line):"
          git diff-tree --no-commit-id --diff-filter=A --name-only -r HEAD || true

          # 取得修改的檔案清單（以空格分隔）
          MODIFIED=$(git diff-tree --no-commit-id --diff-filter=M --name-only -r HEAD | tr '\n' ' ')
          echo "DEBUG: Modified files (one-per-line):"
          git diff-tree --no-commit-id --diff-filter=M --name-only -r HEAD || true

          echo "ADDED raw (space-separated):"
          printf '%s\n' "$ADDED"
          echo "MODIFIED raw (space-separated):"
          printf '%s\n' "$MODIFIED"
          echo "GITHUB_SHA: $GITHUB_SHA"
          echo "git HEAD:"
          git rev-parse --verify HEAD || true
          echo "git status (porcelain):"
          git status --porcelain || true
          # 將結果輸出至 GitHub Actions 環境
          echo "commit_message<<EOF" >> $GITHUB_OUTPUT
          echo "$COMMIT_MSG" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
          echo "added_files<<EOF" >> $GITHUB_OUTPUT
          echo "$ADDED" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
          echo "modified_files<<EOF" >> $GITHUB_OUTPUT
          echo "$MODIFIED" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      # 步驟 7: 將來源檔案路徑映射到公開路徑
      - name: Map source files to public paths
        id: map_files
        run: |
          ADDED_FILES="${{ steps.vars.outputs.added_files }}"
          MODIFIED_FILES="${{ steps.vars.outputs.modified_files }}"
          
          # 函式：將來源檔案路徑映射到公開檔案夾路徑
          map_to_public() {
            local file="$1"
            # 提取檔案名（不含副檔名），例如：0-init.md -> 0-init
            local filename=$(basename "$file" .md)
            # 在 public 資料夾中搜尋相符的目錄
            local public_path=$(find ./public -type d -name "$filename" 2>/dev/null | head -1)
            echo "$public_path"
          }
          
          # 映射新增的檔案
          ADDED_PUBLIC=""
          for file in $ADDED_FILES; do
            if [[ $file == source/_posts/* ]]; then
              public_path=$(map_to_public "$file")
              if [ -n "$public_path" ]; then
                ADDED_PUBLIC="$ADDED_PUBLIC $public_path"
              fi
            fi
          done
          
          # 映射修改的檔案
          MODIFIED_PUBLIC=""
          for file in $MODIFIED_FILES; do
            if [[ $file == source/_posts/* ]]; then
              public_path=$(map_to_public "$file")
              if [ -n "$public_path" ]; then
                MODIFIED_PUBLIC="$MODIFIED_PUBLIC $public_path"
              fi
            fi
          done
          
          echo "Mapped Added Public Paths: $ADDED_PUBLIC"
          echo "Mapped Modified Public Paths: $MODIFIED_PUBLIC"
          # 輸出映射結果
          echo "added_public<<EOF" >> $GITHUB_OUTPUT
          echo "$ADDED_PUBLIC" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
          echo "modified_public<<EOF" >> $GITHUB_OUTPUT
          echo "$MODIFIED_PUBLIC" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      # 步驟 8: 執行 Python 腳本發佈至 Threads
      - name: Run auto push to Threads script
        run: |
          echo "Commit message:" "${{ steps.vars.outputs.commit_message }}"
          echo "Added public paths:" "${{ steps.map_files.outputs.added_public }}"
          echo "Modified public paths:" "${{ steps.map_files.outputs.modified_public }}"
          # 呼叫 Python 腳本，傳入提交訊息和變更的檔案清單
          python3 auto-post-threads.py "${{ steps.vars.outputs.commit_message }}" "${{ steps.map_files.outputs.added_public }}" "${{ steps.map_files.outputs.modified_public }}"
        # 設定環境變數，供 Python 腳本讀取（來自 GitHub Secrets）
        env:
          THREADS_USER_ID: ${{ secrets.THREADS_USER_ID }}
          THREADS_ACCESS_TOKEN: ${{ secrets.THREADS_ACCESS_TOKEN }}
          THREADS_APP_SECRET: ${{ secrets.THREADS_APP_SECRET }}
```
然後 建立一個 `auto-post-threads.py` 檔案，內容如下：
```python
import time
from threads_py import ThreadsClient
import sys
import json
import os

def split_text(text: str, limit=490) -> list[str]:
    # Split the text by newlines and the custom delimiter
    ret = []
    for part in text.split('---SPLIT---'):
        lines = [line for line in part.split('\n')]
        _ret = []
        for line in lines:
            while len(line) > limit:
                _ret.append(line[:limit])
                line = line[limit:]
            if _ret and len(_ret[-1]) + len(line) + 1 <= limit:
                _ret[-1] += '\n' + line
            else:
                _ret.append(line)
        ret.extend(_ret)
    return ret

def load_secrets() -> dict[str, str | bool | dict | None]:
    """Load secrets from environment (preferred) or fallback to secret.json."""
    user_id= str(os.getenv("THREADS_USER_ID"))
    access_token = str(os.getenv("THREADS_ACCESS_TOKEN"))
    app_secret = str(os.getenv("THREADS_APP_SECRET"))
    if user_id and access_token and app_secret:
        return {"user_id": user_id, "access_token": access_token, "app_secret": app_secret, "persist": False}

    # fallback to file
    with open("secret.json", "r", encoding="utf-8") as file:
        ori : dict[str, str] = json.loads(file.read())
    return {"user_id": ori.get("user_id"), "access_token": ori.get("access_token"), "app_secret": ori.get("app_secret"), "persist": True, "ori": ori}


# 從 git hook 傳進來的參數
commit_message = sys.argv[1]
added_files = sys.argv[2].split("./public/")[1:]
modified_files = sys.argv[3].split("./public/")[1:]

# 取得 secrets（優先使用 env）
secrets = load_secrets()

# 初始化 ThreadsClient
threads = ThreadsClient(
    user_id=str(secrets["user_id"]),
    access_token=str(secrets["access_token"])
)

# 則刷新並保存
threads.refresh_access_token()

# Debug 模式，不發文
if commit_message[:5] != "-post":
    print("Test mode, not posting to Threads.")
    sys.exit(0)

text = "我的部落格更新了！ 這次更新了以下內容：\n\n"+commit_message[5:]

posts = split_text(text)
parent = threads.create_post(text=posts[0])
parent = parent.publish()
time.sleep(2)  # 等兩秒，避免發文太快被擋
for post_text in posts[1:]:
    parent = parent.reply(
        threads.create_post(text=post_text)
    )
    time.sleep(2)  # 等兩秒，避免發文太快被擋
print("Published:", parent)
time.sleep(2)  # 等兩秒，避免發文太快被擋

text = ""

if len(added_files) > 0:
    text = "新增的部落格連結：\n"
    for file in added_files:
        if file.strip() == "":
            continue
        text += f"- https://Bryan0324.github.io/{file}\n"

if len(modified_files) > 0:
    text += "修改的部落格連結：\n"
    for file in modified_files:
        if file.strip() == "":
            continue
        text += f"- https://Bryan0324.github.io/{file}\n"

posts = split_text(text)
for post_text in posts:
    parent = parent.reply(
        threads.create_post(text=post_text)
    )
    print("Published reply:", parent)
    time.sleep(2)  # 等兩秒，避免發文太快被擋

print("All done!")
```
## 小提醒
- auto-post-threads.py 會讀取 github action 裡面的環境變數 THREADS_USER_ID 和 THREADS_ACCESS_TOKEN 當作 secrets 使用 所以要先去 github 專案的 settings -> secrets 裡面新增這兩個東西
- 發文的時候會檢查 commit message 的前五個字 如果不是 "-post" 就不會發文 可以用這個來測試
- 發文的時候會把新增和修改的部落格文章連結都發上去

## 後記
* 如果覺得很熟悉的話 對他是從之前寫的 [everyday_coding](https://github.com/Bryan0324/everyday_coding) 的改過來的
* 這個方法是用來自動發文到 threads 的 但是如果想要用來做其他的自動化也可以參考這個方法
* [auto-post-threads.py](https://github.com/Bryan0324/Bryan0324.github.io/blob/main/auto-post-threads.py)
* [.github/workflows/auto_push_to_threads.yml](https://github.com/Bryan0324/Bryan0324.github.io/blob/main/.github/workflows/auto_push_to_threads.yml)


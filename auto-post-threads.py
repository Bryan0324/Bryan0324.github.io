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

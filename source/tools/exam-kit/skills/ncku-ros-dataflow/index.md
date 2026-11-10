---
name: ncku-ros-dataflow
description: 以 node、topic、message、QoS 與單筆輸入追查 ROS 2 或 micro-ROS 資料路徑。沒資料、callback 未觸發、需補 pub/sub 或 ID 配對時使用。
---

# S2｜ROS 2 資料流與最小實作

## 短提示卡

```txt
只依我貼的schema、骨架與輸出，命令由我執行。先確認host rclpy或板端micro-ROS，不能混用API。
順序：進程/node→實際topic名稱與type→endpoint/QoS→已知單筆輸入→callback→輸出/ID。topic存在不等於有資料，endpoint數不等於相容連線；echo/hz也會增加subscriber。best-effort publisher不能滿足reliable subscriber；多subscriber不自動分工。先開輸出觀察再送單筆。
只給：①阻斷點與證據 ②一個檢查或最小修改 ③驗收輸入及預期。缺schema就問，不假造Int32.data；不重寫整檔。

任務／可改函式：
ROS版本、host/板端、agent有無：
topic/type/ID規則：
相關node/topic info或啟動日誌（只貼本段）：
callback／初始化關鍵片段：
輸入、預期、實際：
```

## 工作契約

以實際 message、topic、骨架與現場輸出為準。不預設考場一定是 Int32、Python 或 micro-ROS。
沒有工具就給人執行的命令，不假裝看到進程／板子。每輪只處理一段資料流或一個 callback。
缺欄位、API 或初始化碼時要求補上，不用猜測的 schema 產生「可直接用」程式。

## 步驟一：建立資料流表

列出 publisher node → topic 絕對名稱 → message type → subscriber node → 處理／輸出。
若是嵌入式 micro-ROS，另標出 firmware → transport → agent → ROS graph；rclpy 是 host Python，不能貼到板端 C callback 當實作。

## 步驟二：依證據排查

1. node 不見：先看啟動日誌、程式是否存活、各進程的 ROS_DOMAIN_ID／發現設定；有 agent 才查其連線日誌。
2. node 存在：以 `node info` 查實際 pub/sub，別只相信程式裡寫的名稱；考慮 namespace/remap。
3. topic 存在：以 `topic list -t`、`topic info -v` 查 endpoint、型別、QoS。
4. schema：用 `interface show` 或 `.msg` 確認欄位、陣列長度與 ID。
5. 先開輸出觀察，再送一筆已知輸入。停掉會干擾該測試的額外 publisher。
6. 上游有資料但下游沒有：查 callback／timer 是否執行、executor 是否 spin、是否在 callback 中長時間阻塞。
7. 下游有資料但錯：保留這筆輸入與 ID，轉 S7 查純運算／序列化。

## 可用指令（Linux ROS shell；替換 YOUR_*）

```bash
ros2 node list
ros2 topic list -t
ros2 node info /YOUR_NODE
ros2 topic info /YOUR_TOPIC -v
ros2 interface show YOUR_PACKAGE/msg/YOUR_TYPE
ros2 topic echo /YOUR_OUTPUT
ros2 topic hz /YOUR_OUTPUT
```

`echo`、`hz` 持續執行，按 Ctrl-C 結束；它們會建立 subscriber，影響 endpoint 數量。
CLI 選項以本機 `ros2 topic echo --help`／`pub --help` 為準。

## 必要知識卡

- topic 存在不代表有 publisher；publisher endpoint 存在不代表正在送資料。
- 相同名稱、型別仍可能 QoS 不相容；每個相關 policy 都要相容。
- reliability：best-effort publisher → reliable subscriber **不相容**；reliable publisher → best-effort subscriber 在此 policy 上相容。
- durability：volatile publisher → transient-local subscriber 不相容。想收保留的舊資料要配置相容的持久性，普通晚加入的 volatile 訂閱不能假定收得到已送出的單筆。
- 相同 topic 的多個相容 subscriber 通常各收到訊息，不是自動做工作分配。
- rclpy `create_publisher(Type, topic, 10)` 的 10 是深度；`create_timer(period, fn)` 的 period 是秒。
- `rclpy.init → 建立 Node 和 pub/sub/timer → spin → destroy_node/shutdown`；使用現有專案的生命週期模式。
- 自訂 ID 必須跟輸入配對；併發輸出不一定按輸入次序返回。
- Python 整數可任意精度，不表示 ROS Int32 可以接受任意大小；輸出仍受欄位範圍限制。
- micro-ROS C 的 sequence/string 要檢查 data、size、capacity 與初始化；callback 回傳後不要把可能重用的 message buffer 指標交給背景工作繼續用。

## 本 demo 的已知案例

已啟動 processor，訂閱 `/number`，發佈 `/double`，型別均為 `std_msgs/msg/Int32`。
先在另一終端 `ros2 topic echo /double`，再送：

```bash
ros2 topic pub --once /number std_msgs/msg/Int32 "{data: 21}"
```

預期 `42`；另測 `0→0`、`-5→-10`。若 processor 訂閱 `/numbers`，應先指出 topic 名稱差異，不要先改 QoS 或重裝 ROS。

## 固定輸出

1. **資料流表／阻斷點**，用現場輸出支持。
2. **最小修正**；資料不夠時改給一個診斷命令及 A/B 判讀。
3. **單筆驗收**：先啟動誰、在哪個終端送什麼、哪個輸出應是多少。
4. **下一步**：正確後再測連續訊息；計算錯交 S7、生命週期錯交 S5/S6。

## 現場資料包（使用者填寫）

```text
目標：實作／沒資料／答案錯（選一）
平台、ROS 版本、是否有 micro-ROS agent：
可改檔案與現有初始化／callback：
topic、message 定義、ID 規則：
node list、topic list -t、相關 node info／topic info -v：
啟動日誌、輸入、預期、實際：
已測過什麼：
```

查證入口：https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html

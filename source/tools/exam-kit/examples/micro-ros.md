# micro-ROS 接線模板：先單筆，再多板

依歷屆 README 的 callback／ID／多板需求整理。材料沒有 generated message header、transport 與完整韌體，以下 `YOUR_*` 是待替換欄位；貼進現場既有初始化流程，不另猜板端 transport。

## 先取得這些資料

```text
輸入／輸出 topic：
真實 package/msg/Type（ros2 interface show）：
generated C struct／type support／init 宣告：
ID 欄位與型別：
固定陣列或 sequence？最大筆數／容量：
transport、domain、agent、板型、建置環境：
既有 allocator／support／node／executor 初始化：
```

## 接上 publisher／subscriber／executor

```c
/* YOUR_* 全部替換；input_msg 必須活到 executor 停止使用它。 */
static YOUR_Input input_msg;
static YOUR_Output output_msg;
static rcl_subscription_t subscription;
static rcl_publisher_t publisher;
static rclc_executor_t executor;

/* 放在 transport、support、node 成功建立，message 記憶體準備好之後。
 * CHECK_OK 是你依題目骨架定義的錯誤處理巨集，不是 SDK API。
 * 失敗時停止後續初始化，印出實際錯誤，不繼續 spin 無效 handle。
 */
CHECK_OK(rclc_publisher_init_default(
    &publisher, &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(YOUR_PACKAGE, msg, YOUR_OUTPUT_TYPE),
    YOUR_OUTPUT_TOPIC));
CHECK_OK(rclc_subscription_init_default(
    &subscription, &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(YOUR_PACKAGE, msg, YOUR_INPUT_TYPE),
    YOUR_INPUT_TOPIC));
CHECK_OK(rclc_executor_init(&executor, &support.context, 1, &allocator));
CHECK_OK(rclc_executor_add_subscription(
    &executor, &subscription, &input_msg, on_input, ON_NEW_DATA));
```

需要 headers：`rcl/rcl.h`、`rclc/rclc.h`、`rclc/executor.h` 與現場 generated message header。`on_input` 需先宣告。executor 的 `1` 是 handle 容量；加入 timer／更多 subscription 時增加。default 初始化採 reliable QoS；若上游 best-effort，依現場 header 改用相容的初始化方式。

## 同步 callback：ID 跟資料一起走

```c
static void on_input(const void *raw) {
    const YOUR_Input *in = (const YOUR_Input *)raw;
    /* 檢查 in 的 size／範圍，依正式規格處理不合法輸入。 */
    output_msg.id = in->id;       /* 替換成真實 ID 欄位 */
    /* 在此直接完成純運算，再填入 output_msg 的真實結果欄位。
     * MNIST：用題目提供的模型與 preprocessing。
     * SHA：填 20 個 digest bytes，不能填 40 字元 hex。
     * CRC：先確認 variant 與輸入 bytes。
     */
    rcl_ret_t rc = rcl_publish(&publisher, &output_msg, NULL);
    if (rc != RCL_RET_OK) {
        /* 依骨架記錄／處理 rc；此筆不能算已成功回傳。 */
    }
}
```

主迴圈沿用題目 `rclc_executor_spin_some`／spin；檢查回傳碼，`spin_some` 的 timeout 以 ns 表示。重運算會佔用 callback，先讓同步版本正確，再設計背景 worker。

## 陣列與生命週期

- 固定陣列（例如 `uint8[20]`）使用 generated struct 的內嵌陣列。
- sequence 要有正確 `data`、`size`、`capacity`；generated message `__init` 不代表已配置題目需要的最大接收容量。
- 依現場支援的 generated sequence 初始化／配置方式，在開始 spin 前配置最大輸入容量；發送前設正確 `size`。接收端與輸出端都要處理。
- 若借用靜態陣列作 `data`，不能讓一般 `__fini` 把它當 allocator 配置的記憶體釋放；初始化與清理的所有權必須配對。
- 同步 callback 用完輸入即可；丟給 worker／DMA 時要複製 **ID＋有效 payload** 到自有 buffer。不能只存 `in` 或 `in->values.data` 指標。
- 輸出 buffer 在 `rcl_publish` 返回前保持有效且不變；背景執行緒不得同時改寫共用 `output_msg`。

## 三個最小驗收

1. 一筆固定 ID 與輸入：看到同 ID、正確結果；MNIST 的正確類別由題目 reference 決定。
2. 連續兩筆不同 ID／不同資料：輸出不重複、不被後一筆覆寫。
3. 最大長度與連續多筆：記錄送出／接收／正確數；多板依 [ROS 分派規則](ros2/README) 區分分工與廣播。

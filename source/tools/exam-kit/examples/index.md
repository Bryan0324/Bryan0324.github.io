# 考場程式模板索引

依今年 demo 與歷屆題目整理。先選題型，複製所需函式到題目允許修改的檔案，再依現場介面調整。

## 選模板

| 題型／用途 | 模板與操作說明 | 必改／先確認 |
|---|---|---|
| ROS 2 發送、callback、純運算 | [ROS 2](ros2/README)：[publisher.py](ros2/publisher.py)、[processor.py](ros2/processor.py) | topic、message、QoS、週期、轉換函式 |
| micro-ROS 接收→計算→回傳；多板分工 | [micro-ROS 接線模板](micro-ros) | 真實 generated type、ID、sequence 容量、transport、domain |
| pthread 共享計數與私有結果 | [pthread_counter.c](pthread_counter.c) | worker 數、工作範圍、共享狀態、join 時機 |
| 模擬 engine 的 copy／fill | [搬運模板](transfer/README)、[engine_copy_fill.c](transfer/engine_copy_fill.c) | 容量、筆數、傳輸大小、來源／目的遞增 |
| Pico PIO echo、DMA 記憶體搬運 | [Pico SDK](pico/README)：[main.c](pico/main.c)、[exam_echo.pio](pico/exam_echo.pio) | 板型、SDK、PIO／SM／DMA 資源、shift／FIFO 設定 |
| 歷屆頂點排序、little-endian、CRC32 | [演算法](algorithms/README)、[vertex_ops.h](algorithms/vertex_ops.h) | 排序方向／同值規則、欄位順序、CRC 變體 |
| SHA-1／CRC 的主機參考答案 | [wire_oracle.py](wire_oracle.py) | 只處理串接的 little-endian int32；頂點按 x,y,z 展開 |
| ISA 編碼與位元欄位 | [練習 P7 已知向量](../practice)、[S3](../skills/ncku-isa-binary/) | ISA／擴充、位寬、PC、立即數單位 |

`unclassified/` 是原始材料；上表模板的預設值是練習規格。歷屆自訂 message 的完整 `.msg`、模型權重與韌體骨架未附在材料中，接線模板的 `YOUR_*` 必須用考題實物替換。

## 最短使用流程

1. 先讀題目：可改檔案、輸入輸出、ID、容量、計時與得分條件。
2. 開一份模板，照頁面的「要改什麼」調整；先保留同步、單筆版本。
3. 做一筆已知結果，再做空／極值／連續不同輸入；確認每個 ID 對應正確輸出。
4. 正確後才增加發送率、worker、板數或重疊 DMA。紀錄如下：

```text
題號／可改路徑：
平台／建置命令：
輸入 type/topic → 運算 → 輸出 type/topic：
ID／資料長度／byte order：
版本／這次只改：
送出／收到／正確／耗時／有效吞吐：
已通過的案例／第一個失敗輸入：
```

## 主機端快速驗收

以下在 **Linux／WSL 的 `examples/`** 執行；ROS 與 Pico 另依各頁的環境步驟。輸出執行檔放目前目錄，可自行換成暫存路徑。

```bash
cc -std=c11 -O2 -Wall -Wextra -Werror -pthread pthread_counter.c -o counter
./counter
cc -std=c11 -O2 -Wall -Wextra -Werror algorithms/vertex_demo.c -o vertex_demo
./vertex_demo
python3 wire_oracle.py 1 -2 3
```

預期：counter=40000、checksum=399980000；頂點範例顯示 `vertex checks: PASS`；oracle 的 CRC 為 `0xA4B205E6`。實際本機驗證範圍見 [驗證紀錄](../validation)。

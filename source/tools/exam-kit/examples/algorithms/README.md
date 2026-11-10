# 排序／序列化／CRC／SHA 模板

來源：[歷屆 P3](../unclassified/歷屆成大上機README-僅供參考)。可複製 [vertex_ops.h](vertex_ops.h) 中的純函式到允許修改的 header／程式；[vertex_demo.c](vertex_demo.c) 是主機驗收入口。

## 要改什麼

| 項目 | 目前模板規格 | 現場要確認 |
|---|---|---|
| 座標 | 三個 int32：x、y、z | 真實 message 的型別、欄位與長度 |
| 排序 | 到原點距離平方，小到大 | 升／降序、同距離順序、是否要求 stable |
| 序列化 | 每頂點 x,y,z，各 4 bytes little-endian | 是否包含 ID／長度、原始或排序後順序 |
| CRC | CRC-32/ISO-HDLC | polynomial、init、refin/refout、xorout |
| SHA | 主機 `hashlib.sha1` 參考 | 板端現有 library 的 init/update/final 宣告 |

歷屆 README 沒列完整 CRC 參數與同距離規則；先以題目的 reference／測例確認。此模板同距離 comparator 回 0，`qsort` 不保證穩定。若要穩定排序，加入原始 index 作次要 key，依題意比較。

## 接 callback 的順序

1. 保存輸入 ID 與有效筆數；檢查輸出容量。
2. **排序分支**：將有效頂點複製到自有工作陣列，再 `qsort(work, count, sizeof work[0], vertex_compare)`；把 ID／排序後資料／size 填回輸出。
3. **hash 分支**：將原始輸入按序打包。若排序也在同一進程執行，不要先原地排序再算原始輸入 hash。
4. `vertices_pack_le` 成功後，byte length 是 `count * 12`。容量檢查用除法，避免先乘溢位。容量由題目最大筆數決定，不在小型板端 stack 放未知大小陣列。
5. CRC 填數值欄位；SHA 填 20 個原始 bytes。不要把 hex 字串當 digest。

generated ROS vertex struct 未必與 `vertex_t` 相同；逐欄複製或改寫函式參數，不以強制轉型猜記憶體布局。所有平方先升成 int64，再轉 uint64 累加；三個 `INT32_MIN` 的平方和是 `0xC000000000000000`，超過 int64，但仍在 uint64 內。

## SHA-1 板端接線

依現場 library 的真實 API 做 `init → update(bytes, byte_length) → final(digest)`。若 RAM 不夠放完整序列化 buffer，可每個頂點打包 12 bytes，對同一 context 多次 update；只 init 一次、最後 final 一次。不可每個頂點各算 hash 再串接。

MNIST 也採相同分層：先比對輸入灰階／正規化、模型 header／權重與輸出類別，再接 ROS；材料未附模型，不能用假推論函式替代。

## 驗收（在 `examples/`）

```bash
cc -std=c11 -O2 -Wall -Wextra -Werror algorithms/vertex_demo.c -o vertex_demo
./vertex_demo
python3 wire_oracle.py 1 -2 3
```

demo 檢查最大距離、同距離、不足容量不寫入、尾端 sentinel、空輸入與 CRC 已知向量。

對一個頂點 `(1,-2,3)`：

```text
bytes = 01 00 00 00 FE FF FF FF 03 00 00 00
SHA-1 = 77a48f509d89a0c3cb09e99fa4b9b495299e5341
CRC-32/ISO-HDLC = A4B205E6
```

多頂點按 `x0 y0 z0 x1 y1 z1 ...` 傳給 [wire_oracle.py](../wire_oracle.py)。先比 bytes，再比 hash；字串 `123456789` 的標準 CRC 應為 `CBF43926`。

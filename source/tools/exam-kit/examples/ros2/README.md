# ROS 2 發送與處理模板

來源：[section2-1](../unclassified/demo/section2-1/README)。兩個檔案可在有 `rclpy`、`std_msgs` 的 ROS 2 環境執行。

## 要改什麼

- [processor.py](processor.py)：`INPUT_TOPIC`、`OUTPUT_TOPIC`、message import、`transform()`、callback 的欄位。先把運算留在純函式，方便單獨比對。
- [publisher.py](publisher.py)：`TOPICS`、`VALUES`、`PERIOD_SECONDS` 與打包欄位。預設只發 3 筆，完成後留在 spin，按 Ctrl-C 結束。
- 兩端預設 reliable/volatile、depth=10；按實際 endpoint／題目調整。depth 不是發送頻率。
- 預設乘二超出 int32 時記錄錯誤、不回傳。若題目要求飽和、模數或錯誤訊息，改成該規則。

## 在原 demo container 練習

以下在 **主機 `examples/`** 用 Bash 執行；這次掛載整個 examples，模板也會在 container 內：

```bash
docker build -t srecruit-demo unclassified/demo
docker run --rm -it --name srecruit-demo -v "$PWD:/examples" srecruit-demo
```

若已有同名 container，可使用原容器，但必須確認其掛載內有模板。第二、三個主機終端各執行 `docker exec -it srecruit-demo bash`。

1. container 終端 A：`python3 /examples/ros2/processor.py`。
2. container 終端 B：`ros2 topic echo /double`，等訂閱建立。
3. container 終端 C：`python3 /examples/ros2/publisher.py`。

B 應依序收到 42、0、-10。停其他 `/number` publisher，避免混入資料。也可不用 feeder，在 C 執行：

```bash
ros2 topic pub --once /number std_msgs/msg/Int32 "{data: 21}"
```

沒有輸出時先查 `ros2 topic info /number -v` 與 `ros2 topic info /double -v`，再用 [S2](../../skills/ncku-ros-dataflow/) 排查。

## 換成歷屆 message／多板

1. `ros2 interface show 真實套件/msg/真實型別`，取得欄位、陣列長度與 ID 規格。
2. 在 publisher 建立 message、填入資料與全域 ID；processor／板端回傳相同 ID。`Int32` 沒有 ID，不能用抵達順序替代題目的 ID。
3. 歷屆 P2 是兩個不同輸入 topic：可將 `TOPICS` 改為 A/B topic，依全域 index 輪流分派；同一份資料只發給一板，不能各板都從 ID=0 重編。
4. 歷屆 P3 是同一 topic 廣播給三個演算法；每板都需要每筆資料。P3 host 僅允許改 rate，這份 feeder 只適合練習或題目允許改 publisher 時使用。

發現 subscriber 只代表 endpoint 存在；echo 也算 subscriber。驗收以 processor／板端輸出與 ID 為準。發送率先慢到每筆都正確，再調快。

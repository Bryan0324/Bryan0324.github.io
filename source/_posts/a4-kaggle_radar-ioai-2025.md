---
title: Kaggle Radar －－ IOAI 2025 的AI訓練挑戰賽
date: 2026-06-15
categories: [AI-training]
tags: [AI-training]
---

IOAITW選上選訓營了，打算練習一下歷屆。

# IOAI 2025 Radar

他有給我範例程式碼，當然要跑跑看 ~~或許跑下去就直接通過了~~  

![Baseline](/img/a4-kaggle_radar-ioai-2025/Baseline.png)  

天下沒有白吃的午餐 跑出來的分數是 0.6
比想像中的好就是了

那下一步就是看看他的loss了

![Baseline_loss](/img/a4-kaggle_radar-ioai-2025/Baseline_loss.png)

看起來很好啊 loss測試和訓練都在下降 沒有過擬合的跡象 而且loss很低

那為什麼分數只有0.6

![Evaluation](/img/a4-kaggle_radar-ioai-2025/Evaluation.png)

原來是因為評分標準的差異

注意到預測對物件的分數極高
但是對背景的分數極低

所以要加權

```py
weights = torch.tensor([1.0, 50.0, 50.0, 50.0, 50.0], device="cuda")
criterion = nn.CrossEntropyLoss(weight=weights)

# (可以理解成weights[label]會是該類別的權重)
```

加權之後分數就上去了

![weighted](/img/a4-kaggle_radar-ioai-2025/weighted.png)

0.86 官解是 0.87 

把num_epochs調高一點試試看 他baseline定義中預設num_epochs=100
但實際train卻用40而已
試試看100好了

![](/img/a4-kaggle_radar-ioai-2025/epoch_100.png)
哈 超過官解了

![epoch_100_loss](/img/a4-kaggle_radar-ioai-2025/epoch_100_loss.png)
可以注意到loss在後期有鋸齒狀的波動
所以可能要動態調整學習率了(後期跨幅過大了)

```py
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau

optimizer = optim.Adam(model.parameters(), lr=0.001)

# 2. 定義 ReduceLROnPlateau 排程器
scheduler = ReduceLROnPlateau(
    optimizer, 
    mode='min',       # 因為我們看的是 Loss，目標是讓它越「小」越好
    factor=0.1,       # 觸發時，新 LR = 舊 LR * 0.1 (直接縮小 10 倍)
    patience=5       # 容忍度：如果連續 5 個 Epoch 驗證集 Loss 都沒有進步，就動手調整
)

# 然後把所有optimizer.step()的地方改成 scheduler.step(val_loss) 就好了
```

![where_is_my_Grad](/img/a4-kaggle_radar-ioai-2025/where_is_my_Grad.png)

挺糟糕的看起來是梯度消失了

(反正已經超過官解了就不調整了 先放著吧)

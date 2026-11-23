---
title: 神奇的位元運算小課堂 Gosper’s Hack
date: 2026-09-16
tags: [競程, 位元運算]
categories: [競程]
---

簡單來說就是 $C(n, k)$ 的取法以數字表示
`00100110`
推到字典序下一個
`00101001`
的方式


```cpp
ori = now
now += now & (-now)
now += (1<<popcount(ori^now)-2) - 1
```
(這不是原本的方法 但我覺得這樣寫比較好看)

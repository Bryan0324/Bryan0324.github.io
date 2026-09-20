---
title: ais3 junior －－ Day3 writeup-Reverse篇 和碎碎念(如果有的話)
date: 2026-08-06
tags: [資安, Reverse]
categories: [ais3-junior]
---

# Reverse-1

![reverse-1](/img/a7-ais3-jr-Day3-Reverse/1-reverse-1.png)

點兩下check_password來看這個函數的內容

![flag](/img/a7-ais3-jr-Day3-Reverse/2-reverse-1-flag.png)


# Reverse-2

和上題一樣點兩下check_password來看這個函數的內容

![reverse-2](/img/a7-ais3-jr-Day3-Reverse/3-reverse-2.png)

雖然看到flag了但有點空，把程式的邏輯寫出來
```cpp
int main()
{
    cin.tie(0)->sync_with_stdio(false);
    string s;
    cin >> s;
    reverse(s.begin(), s.end());
    /* equal
    for(int i = s.size()-1, j = 0; j < i; i--, j++)
    {
        swap(s[i], s[j]);
    }
    */
    if(s == "}em4n3r{3SIA")cout << "Correct!";
    else cout << "Wrong!";
}
```

# Reverse-3

![reverse-3](/img/a7-ais3-jr-Day3-Reverse/4-reverse-3.png)

按Tab跳到組語
編輯組語

![reverse-3](/img/a7-ais3-jr-Day3-Reverse/5-reverse-3.png)

(上面的等式我也稍微改了一下)

![alt text](/img/a7-ais3-jr-Day3-Reverse/6-reverse-3.png)

儲存變更

![alt text](/img/a7-ais3-jr-Day3-Reverse/7-reverse-3-shell.png)


# Rev-HW-01

按 X 來看變數在哪裡被引用

![8_Rev-HW-01](/img/a7-ais3-jr-Day3-Reverse/8_Rev-HW-01.png)


# Rev-HW-02
![9_Rev-HW-02](/img/a7-ais3-jr-Day3-Reverse/9_Rev-HW-02.png)

凱薩密碼 shift=1
可以直接用肉眼看外加一點點通靈 \(\_ + 1 ==  \`\)
AIS3{n0t_r4w_str}
(還是驗證一下比較好)

![a1_Rev-HW-02](/img/a7-ais3-jr-Day3-Reverse/a1_Rev-HW-02.png)


# Rev-HW-03

![a2_Rev-HW-03](/img/a7-ais3-jr-Day3-Reverse/a2_Rev-HW-03.png)

兩兩交換

![a3_Rev-HW-03](/img/a7-ais3-jr-Day3-Reverse/a3_Rev-HW-03.png)


# Rev-HW-04

![alt text](/img/a7-ais3-jr-Day3-Reverse/a4_Rev-HW-04.png)
![alt text](/img/a7-ais3-jr-Day3-Reverse/a5_Rev-HW-04.png)
點兩下看expected裝什麼
![alt text](/img/a7-ais3-jr-Day3-Reverse/a6_Rev-HW-04.png)
![alt text](/img/a7-ais3-jr-Day3-Reverse/a7_Rev-HW-04.png)


# Rev-HW-05

他有多層防護

1. 字串長度 == 64
2. 字串的前 16 位要和 v3 相等

解法:
~~所以只要直接在開場就呼叫win()就好~~

![alt text](/img/a7-ais3-jr-Day3-Reverse/a8_Rev-HW-05.png)
![alt text](/img/a7-ais3-jr-Day3-Reverse/a9_Rev-HW-05.png)


# Rev-HW-06

- 第零關
    ![alt text](/img/a7-ais3-jr-Day3-Reverse/b1_Rev-HW-06_stage0.png)
    這個等式永遠不成立

- 第一關
    ![alt text](/img/a7-ais3-jr-Day3-Reverse/b2_Rev-HW-06_stage1.png)
    - v2 = (a1 長度 > 31) + (a1[0] == 127)
    - v2 -= 100*(v2 == 79218/3 == 26406) 
    - v2 == 2的話進入第二關
    只要滿足(a1 長度 > 31) && (a1[0] == 127)即可

- 第二關
    ![alt text](/img/a7-ais3-jr-Day3-Reverse/b3_Rev-HW-06_stage2.png)
    a1取最長不含0的前綴子字串的每個字元的合 == 10794
    即可獲勝

統整一下要達成什麼
- len(a1) > 31
- a1[0] == 127
- a1取最長不含0的前綴子字串的每個字元的合 == 10794

就這樣而已嗎(?)
還有一個隱藏關卡

![alt text](/img/a7-ais3-jr-Day3-Reverse/b4_Rev-HW-06_stageEx.png)

只能有63個字元

這是 Reverse 的最後一題了 接下來就是 Pwn 
所以來直接用 pwn-tool 解吧
```py    
import pwn

r = pwn.process('00-challenges/AIS3-jr/hw/reverse/hw06.out')
del_char = b'\x7f'
max_char = b'\xff'
r.send(del_char + max_char*41 + b'\xd4' + b'\000'*64)
# 後記: r.sendline(del_char + max_char*41 + b'\xd4') 會更好
print(r.recvall())
```

![alt text](/img/a7-ais3-jr-Day3-Reverse/b5_Rev-HW-06_flag.png)
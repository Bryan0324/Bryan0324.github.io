---
name: ncku-isa-binary
description: 根據格式表處理 ISA 編碼、立即數、分支位移與二進位欄位。遇到 RISC-V 指令格式、欄位重排、符號延伸或 byte stream 解讀時使用。
---

# S3｜ISA 與二進位格式

## 短提示卡

```txt
我懂C位元運算；請聚焦格式與架構規則。先確認ISA/擴充、word或bytes、byte order、符號、PC與offset單位。沒有規格就問，不能把PIO當RISC-V。
先列來源bits→目的bits，再寫最小實作。標準RV32I branch/JAL以當前指令PC加offset；B/J需重排bits並符號延伸，不可再重複乘2；JALR是(rs1+符號延伸imm12)清bit0。alignment依架構；有C擴充不能一律當4-byte指令。
只給：①欄位表 ②目標函式最小修改 ③一個已知數值驗算與邊界。不宣稱已組譯；驗證由我執行。

需求／可改函式：
格式圖文字／ISA與擴充：
輸入表示、位寬、符號、byte order：
PC/offset規則：
目前片段、預期與實際：
```

## 工作契約

使用者熟悉 C 位元運算，不必重教 AND/OR。專注於格式解讀、架構規則與可驗證的欄位映射。
題目格式／指定 ISA 版本優先；不把任意封包當成 RISC-V，也不把 RISC-V 指令寫進 PIO。
沒有組譯器或執行環境時，標記手算／主機模擬驗證，不能宣稱已在目標板執行。

## 執行步驟

1. 確定要做 encoding、decoding、emulation、assembly porting，還是純封包解析。
2. 寫清輸入表示：整數 word 或記憶體 bytes；位元編號、byte order、欄位符號、範圍與非法值處理。
3. 先做欄位表「來源 bits → 目的 bits → 寬度 → 是否符號延伸」，再寫程式。
4. 分支／跳躍另外標「基準 PC、offset 的 byte 單位、alignment」。移位立即數不要當一般 signed immediate。
5. 用獨立已知案例驗證，不只以自家 encode→decode round trip 驗證，因兩邊可能犯同樣錯。
6. 測正／負／零、最小／最大可表示值、超範圍與對齊失敗，按題目決定 reject／截斷／其他行為。

## RV32I 知識卡（僅限確定是 32-bit 基礎指令時）

| 欄位 | instruction bits |
|---|---|
| opcode | 6:0 |
| rd | 11:7 |
| funct3 | 14:12 |
| rs1 | 19:15 |
| rs2 | 24:20 |
| funct7 | 31:25 |

這些是共同位置，不代表每一種格式都含所有欄位。判斷指令需按 opcode 與相應 funct 欄位，不可只看 opcode。

- I immediate：inst[31:20]，一般算術／load 等為 signed 12-bit；shift-immediate 有額外編碼規則。
- S immediate：imm[11:5]=inst[31:25]，imm[4:0]=inst[11:7]。
- B byte offset：imm[12]=inst[31]，imm[11]=inst[7]，imm[10:5]=inst[30:25]，imm[4:1]=inst[11:8]，imm[0]=0；組合後視為 signed 13-bit。
- J byte offset：imm[20]=inst[31]，imm[19:12]=inst[19:12]，imm[11]=inst[20]，imm[10:1]=inst[30:21]，imm[0]=0；組合後視為 signed 21-bit。
- U：inst[31:12] 放回高 20 bits，低 12 bits 為零。
- branch/JAL 的 target 以該指令的 PC 加 offset，不是下一條 PC。JAL link 是 PC+4。
- JALR target 是 `(rs1 + sign_extended_imm12) & ~1`，其 immediate 不另乘 2。
- x0 讀出零、寫入丟棄。RV32I 不等於一定有 M/A/C 擴充；若有 C，不能假設所有指令都是 4 bytes。
- 指令 offset 可用 2-byte 單位編碼，不代表純 RV32I 允許跳到任意 2-byte 對齊位址；IALIGN 依擴充決定。

## C／Python 邊界提醒

- C shift count 不可為負或達到型別位寬；先選足夠寬的 unsigned 型別。
- Python 整數沒有自動截成 32 bits；模擬固定寬度時顯式 mask。
- 符號延伸可在足夠寬的 signed 中處理：先取 n-bit unsigned 值 u，若符號位為 1，數值為 `u - 2^n`。
- `uint32_t x=0xA5` 的 32-bit 反相是 `0xFFFFFF5A`；只看低 8-bit 才是 `0x5A`。
- little-endian 的 0x12345678 bytes 是 `78 56 34 12`；這不改變整數欄位的 bit 編號。
- 遇到 inline asm，還需要 compiler、target、ABI、constraints/clobbers；不以主機 x86 組譯成功當目標 ISA 驗證。

## 微型驗證

標準 RV32I `addi x1, x0, -1`：opcode=0x13、rd=1、funct3=0、rs1=0、imm12=0xFFF，word=`0xFFF00093`。
若以 little-endian bytes 輸入，則 `93 00 F0 FF`。這是格式驗證案例，不表示題目要求此指令。

## 固定輸出

1. **格式與假設**：架構、位寬、byte order、單位。
2. **欄位表＋最小實作**：標出範圍前提，不任意吞非法輸入。
3. **一個完整數值驗算＋邊界案例**。
4. **獨立驗證方式**：指定現場已有的 assembler/disassembler 或簡單參考程式；缺工具時不編造命令名稱。

## 現場資料包（使用者填寫）

```text
任務與可改函式：
格式圖／ISA／架構擴充：
輸入是 word 還是 bytes、byte order：
位寬、符號、合法範圍：
PC／offset 規則（若有）：
範例輸入、預期／實際輸出：
現有程式與工具鏈：
```

查證入口：https://docs.riscv.org/reference/isa/v20260120/unpriv/rv32.html

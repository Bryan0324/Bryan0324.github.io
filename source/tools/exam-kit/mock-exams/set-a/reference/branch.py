"""Q4 reference. Only BEQ, RV32I without compressed instructions."""


def decode_beq(word, pc):
    if any(type(value) is not int or not 0 <= value <= 0xffffffff for value in (word, pc)):
        raise ValueError("word and pc must be uint32 integers")
    if pc % 4 or (word & 0x7f) != 0x63 or ((word >> 12) & 7) != 0:
        raise ValueError("unaligned PC or unsupported instruction")
    offset = (((word >> 31) & 1) << 12 | ((word >> 7) & 1) << 11 |
              ((word >> 25) & 0x3f) << 5 | ((word >> 8) & 0xf) << 1)
    if offset & 0x1000:
        offset -= 0x2000
    target = (pc + offset) & 0xffffffff
    if target % 4:
        raise ValueError("taken branch has an unaligned target")
    return {"rs1": (word >> 15) & 31, "rs2": (word >> 20) & 31,
            "offset": offset, "target": target}

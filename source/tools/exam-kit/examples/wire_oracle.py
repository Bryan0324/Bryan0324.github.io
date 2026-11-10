"""Reference ONLY for concatenated little-endian signed int32 values.

No ID, struct padding, length prefix, or trailing NUL is included.
CRC variant: CRC-32/ISO-HDLC (as implemented by zlib.crc32).
Run: python3 wire_oracle.py 1 -2 3
With no values, hashes the empty byte string.
"""
import argparse
import hashlib
import struct
import zlib


def pack_i32_le(values):
    for value in values:
        if not -(1 << 31) <= value < (1 << 31):
            raise ValueError(f"out of int32 range: {value}")
    return b"".join(struct.pack("<i", value) for value in values)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("values", nargs="*", type=int)
    args = parser.parse_args()
    try:
        data = pack_i32_le(args.values)
    except ValueError as error:
        parser.error(str(error))
    print(f"length_bytes={len(data)}")
    print(f"bytes_hex={data.hex(' ')}")
    print(f"sha1_hex={hashlib.sha1(data).hexdigest()}")
    print(f"crc32_iso_hdlc=0x{zlib.crc32(data) & 0xffffffff:08X}")


if __name__ == "__main__":
    main()

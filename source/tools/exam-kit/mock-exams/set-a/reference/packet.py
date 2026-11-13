"""Q1 reference. Open only after finishing the mock exam."""
import struct
import zlib


def handle(message):
    if type(message) is not dict or set(message) != {"id", "values"}:
        raise ValueError("expected exactly id and values")
    identifier = message["id"]
    values = message["values"]
    if type(identifier) is not int or not 0 <= identifier <= 0xffffffff:
        raise ValueError("id must be uint32")
    if type(values) is not list or len(values) > 64:
        raise ValueError("values must be a list with at most 64 items")
    if any(type(value) is not int or not -(1 << 31) <= value < (1 << 31) for value in values):
        raise ValueError("values must contain int32 integers")
    data = struct.pack("<" + "i" * len(values), *values)
    return {"id": identifier, "sum": sum(values), "crc32": zlib.crc32(data),
            "byte_count": len(data)}

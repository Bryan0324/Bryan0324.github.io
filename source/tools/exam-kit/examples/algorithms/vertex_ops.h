/* Host/embedded C template. Coordinates: int32; ascending squared distance.
 * Equal-distance ordering is unspecified. Change it to match the exam.
 * Serialization: x,y,z little-endian, no ID/count/padding/trailing NUL.
 */
#ifndef EXAM_VERTEX_OPS_H
#define EXAM_VERTEX_OPS_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct {
    int32_t x, y, z;
} vertex_t;

static inline uint64_t vertex_distance2(const vertex_t *v) {
    /* Each square fits int64, but their sum may exceed INT64_MAX. */
    int64_t x = v->x, y = v->y, z = v->z;
    return (uint64_t)(x * x) + (uint64_t)(y * y) + (uint64_t)(z * z);
}

static inline int vertex_compare(const void *left, const void *right) {
    uint64_t a = vertex_distance2((const vertex_t *)left);
    uint64_t b = vertex_distance2((const vertex_t *)right);
    return (a > b) - (a < b); /* Do not subtract and truncate to int. */
}

static inline void store_i32_le(uint8_t out[4], int32_t value) {
    uint32_t bits = (uint32_t)value;
    out[0] = (uint8_t)bits;
    out[1] = (uint8_t)(bits >> 8);
    out[2] = (uint8_t)(bits >> 16);
    out[3] = (uint8_t)(bits >> 24);
}

/* Pointers must refer to the stated capacities; input/output cannot overlap.
 * On capacity failure, no bytes are written. count=0 allows NULL buffers.
 */
static inline bool vertices_pack_le(const vertex_t *vertices, size_t count,
                                    uint8_t *out, size_t capacity) {
    if (count > capacity / 12) return false;
    for (size_t i = 0; i < count; ++i) {
        store_i32_le(out + i * 12, vertices[i].x);
        store_i32_le(out + i * 12 + 4, vertices[i].y);
        store_i32_le(out + i * 12 + 8, vertices[i].z);
    }
    return true;
}

/* CRC-32/ISO-HDLC only: reflected polynomial, init/xorout=0xffffffff.
 * Input is bytes, not a C struct. Simple bitwise baseline; no lookup table.
 */
static inline uint32_t crc32_iso_hdlc(const uint8_t *data, size_t length) {
    uint32_t crc = UINT32_C(0xffffffff);
    for (size_t i = 0; i < length; ++i) {
        crc ^= data[i];
        for (unsigned bit = 0; bit < 8; ++bit) {
            crc = (crc >> 1) ^ ((crc & 1) ? UINT32_C(0xedb88320) : 0);
        }
    }
    return crc ^ UINT32_C(0xffffffff);
}

#endif

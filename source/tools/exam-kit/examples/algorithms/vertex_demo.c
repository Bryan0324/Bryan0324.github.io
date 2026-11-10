/* Build from examples/: cc -std=c11 -Wall -Wextra -Werror algorithms/vertex_demo.c -o vertex_demo */
#include "vertex_ops.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    const vertex_t input = {1, -2, 3};
    const uint8_t expected[] = {1, 0, 0, 0, 0xfe, 0xff, 0xff, 0xff, 3, 0, 0, 0};
    uint8_t bytes[13] = {0};
    bytes[12] = 0xa5;
    assert(vertices_pack_le(&input, 1, bytes, 12));
    assert(memcmp(bytes, expected, 12) == 0);
    assert(bytes[12] == 0xa5);
    assert(crc32_iso_hdlc(bytes, 12) == UINT32_C(0xa4b205e6));
    assert(crc32_iso_hdlc((const uint8_t *)"123456789", 9) == UINT32_C(0xcbf43926));
    assert(crc32_iso_hdlc(NULL, 0) == 0);
    assert(vertices_pack_le(NULL, 0, NULL, 0));
    memset(bytes, 0x5a, sizeof bytes);
    assert(!vertices_pack_le(&input, 1, bytes, 11));
    for (size_t i = 0; i < sizeof bytes; ++i) assert(bytes[i] == 0x5a);

    const vertex_t extreme = {INT32_MIN, INT32_MIN, INT32_MIN};
    assert(vertex_distance2(&extreme) == UINT64_C(0xc000000000000000));
    vertex_t values[] = {extreme, {1, -2, 3}, {0, 0, 0}, {-1, 0, 0}, {1, 0, 0}};
    const uint64_t keys[] = {0, 1, 1, 14, UINT64_C(0xc000000000000000)};
    qsort(values, sizeof values / sizeof values[0], sizeof values[0], vertex_compare);
    for (size_t i = 0; i < sizeof values / sizeof values[0]; ++i) {
        assert(vertex_distance2(&values[i]) == keys[i]);
    }
    puts("vertex checks: PASS");
    return 0;
}

/* Template for the supplied HOST engine API, not Pico DMA.
 * The supplied engine implementation has synchronization limitations;
 * see README.md before using it as a concurrency example.
 */
#include "engine.h"
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

enum { COUNT = 8 };

static int run_job(const void *src, void *dst, size_t count, bool increment) {
    int ch = engine_claim();
    if (ch < 0) {
        fputs("no free engine channel\n", stderr);
        return -1; /* Replace with the specified wait/queue/error policy. */
    }
    engine_job_t job = {
        .src = src,
        .dst = dst,
        .count = count, /* transfers, NOT bytes; this caller always uses 8 */
        .size = XFER_32,
        .src_increment = increment,
        .dst_increment = true,
    };
    engine_configure(ch, &job);
    engine_start(ch);
    engine_wait(ch);
    engine_release(ch);
    return 0;
}

int main(void) {
    uint32_t source[COUNT];
    uint32_t dest[COUNT + 1];
    const uint32_t sentinel = UINT32_C(0x13579bdf);
    const uint32_t pattern = UINT32_C(0xa5a5a5a5);
    for (unsigned round = 0; round < 2; ++round) {
        for (unsigned i = 0; i < COUNT; ++i) {
            source[i] = round * 100 + i;
            dest[i] = 0;
        }
        dest[COUNT] = sentinel;
        if (run_job(source, dest, COUNT, true) != 0) return EXIT_FAILURE;
        for (unsigned i = 0; i < COUNT; ++i) {
            if (dest[i] != source[i]) return EXIT_FAILURE;
        }
        if (dest[COUNT] != sentinel) return EXIT_FAILURE;
        if (run_job(&pattern, dest, COUNT, false) != 0) return EXIT_FAILURE;
        for (unsigned i = 0; i < COUNT; ++i) {
            if (dest[i] != pattern) return EXIT_FAILURE;
        }
        if (dest[COUNT] != sentinel) return EXIT_FAILURE;
    }
    puts("engine copy/fill: PASS (2 rounds)");
    return EXIT_SUCCESS;
}

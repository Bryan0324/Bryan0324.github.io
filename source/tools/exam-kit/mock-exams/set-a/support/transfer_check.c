/* Read-only functional harness. No asynchronous engine or hardware is used. */
#include "transfer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHECK(condition) do { \
    if (!(condition)) { \
        fprintf(stderr, "FAIL line %d: %s\n", __LINE__, #condition); \
        return 1; \
    } \
} while (0)

static bool same_job(const job_t *a, const job_t *b) {
    return a->src == b->src && a->dst == b->dst && a->count == b->count &&
           a->size == b->size && a->src_increment == b->src_increment &&
           a->dst_increment == b->dst_increment;
}

/* Called only AFTER the descriptor and its limits have been checked. */
static void simulate(const job_t *job) {
    const uint32_t *src = job->src;
    uint32_t *dst = job->dst;
    for (size_t i = 0; i < job->count; ++i) {
        dst[i] = src[job->src_increment ? i : 0];
    }
}

static int valid_case(bool fill, size_t n, uint32_t seed) {
    uint32_t source[8], saved_source[8], dest[10], before[10];
    uint32_t pattern = seed ^ UINT32_C(0xa5a5a5a5);
    uint32_t saved_pattern = pattern;
    for (size_t i = 0; i < 8; ++i) source[i] = seed + (uint32_t)i * 17;
    for (size_t i = 0; i < 10; ++i) dest[i] = UINT32_C(0x13579bdf);
    memcpy(saved_source, source, sizeof source);
    memcpy(before, dest, sizeof dest);
    job_t job = {0};
    int rc = fill ? plan_fill(&job, &pattern, dest + 1, 8, n)
                  : plan_copy(&job, source, 8, dest + 1, 8, n);
    CHECK(rc == 0);
    CHECK(job.src == (fill ? (const void *)&pattern : (const void *)source));
    CHECK(job.dst == dest + 1);
    CHECK(job.count == n && n <= 8);
    CHECK(job.size == XFER_32);
    CHECK(job.src_increment == !fill && job.dst_increment);
    CHECK(memcmp(source, saved_source, sizeof source) == 0);
    CHECK(memcmp(dest, before, sizeof dest) == 0);
    CHECK(pattern == saved_pattern);
    simulate(&job);
    for (size_t i = 0; i < n; ++i) CHECK(dest[i + 1] == (fill ? pattern : source[i]));
    CHECK(dest[0] == before[0]);
    for (size_t i = n + 1; i < 10; ++i) CHECK(dest[i] == before[i]);
    return 0;
}

static int invalid_cases(void) {
    uint32_t src[8] = {1}, dst[8] = {0};
    const job_t original = {src, dst, 7, XFER_16, false, false};
    job_t job = original;
    CHECK(plan_copy(NULL, src, 8, dst, 8, 1) == -1);
    CHECK(plan_fill(NULL, src, dst, 8, 1) == -1);
    CHECK(plan_copy(&job, NULL, 8, dst, 8, 1) == -1);
    CHECK(same_job(&job, &original));
    CHECK(plan_copy(&job, src, 8, NULL, 8, 1) == -1);
    CHECK(same_job(&job, &original));
    CHECK(plan_fill(&job, NULL, dst, 8, 1) == -1);
    CHECK(same_job(&job, &original));
    CHECK(plan_fill(&job, src, NULL, 8, 1) == -1);
    CHECK(same_job(&job, &original));
    const size_t counts[] = {0, 9, SIZE_MAX};
    for (size_t i = 0; i < sizeof counts / sizeof counts[0]; ++i) {
        CHECK(plan_copy(&job, src, 8, dst, 8, counts[i]) == -1);
        CHECK(same_job(&job, &original));
        CHECK(plan_fill(&job, src, dst, 8, counts[i]) == -1);
        CHECK(same_job(&job, &original));
    }
    CHECK(plan_copy(&job, src, 0, dst, 8, 1) == -1);
    CHECK(same_job(&job, &original));
    CHECK(plan_copy(&job, src, 8, dst, 0, 1) == -1);
    CHECK(same_job(&job, &original));
    CHECK(plan_fill(&job, src, dst, 0, 1) == -1);
    CHECK(same_job(&job, &original));
    CHECK(dst[0] == 0 && src[0] == 1);
    return 0;
}

static int consecutive_rounds(void) {
    uint32_t src[8], dst[10], pattern;
    job_t job = {0};
    for (unsigned round = 0; round < 2; ++round) {
        size_t n = round == 0 ? 8 : 3;
        for (size_t i = 0; i < 8; ++i) src[i] = 100 * round + (uint32_t)i;
        for (size_t i = 0; i < 10; ++i) dst[i] = UINT32_C(0xdeadbeef);
        CHECK(plan_copy(&job, src, 8, dst + 1, 8, n) == 0);
        CHECK(job.src == src && job.dst == dst + 1 && job.count == n);
        CHECK(job.size == XFER_32 && job.src_increment && job.dst_increment);
        simulate(&job);
        for (size_t i = 0; i < n; ++i) CHECK(dst[i + 1] == src[i]);
        CHECK(dst[0] == UINT32_C(0xdeadbeef));
        for (size_t i = n + 1; i < 10; ++i) CHECK(dst[i] == UINT32_C(0xdeadbeef));
        pattern = UINT32_C(0xff00aa00) + round;
        CHECK(plan_fill(&job, &pattern, dst + 1, 8, n) == 0);
        CHECK(job.src == &pattern && job.dst == dst + 1 && job.count == n);
        CHECK(job.size == XFER_32 && !job.src_increment && job.dst_increment);
        simulate(&job);
        for (size_t i = 0; i < n; ++i) CHECK(dst[i + 1] == pattern);
        CHECK(dst[0] == UINT32_C(0xdeadbeef));
        for (size_t i = n + 1; i < 10; ++i) CHECK(dst[i] == UINT32_C(0xdeadbeef));
    }
    return 0;
}

int main(int argc, char **argv) {
    if (argc != 2) return 2;
    if (strcmp(argv[1], "0") == 0) {
        CHECK(valid_case(false, 1, 9) == 0);
        CHECK(valid_case(false, 8, UINT32_C(0xffffff80)) == 0);
    } else if (strcmp(argv[1], "1") == 0) {
        CHECK(valid_case(true, 1, 0) == 0);
        CHECK(valid_case(true, 8, UINT32_MAX) == 0);
    } else if (strcmp(argv[1], "2") == 0) {
        CHECK(invalid_cases() == 0);
    } else if (strcmp(argv[1], "3") == 0) {
        CHECK(consecutive_rounds() == 0);
    } else {
        return 2;
    }
    puts("PASS");
    return 0;
}

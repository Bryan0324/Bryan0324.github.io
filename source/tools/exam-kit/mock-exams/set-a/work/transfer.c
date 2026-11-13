#include "transfer.h"

int plan_copy(job_t *out, const uint32_t *src, size_t src_count,
              uint32_t *dst, size_t dst_count, size_t n) {
    (void)out; (void)src; (void)src_count;
    (void)dst; (void)dst_count; (void)n;
    return -2; /* TODO: 0 on success, -1 on invalid input. */
}

int plan_fill(job_t *out, const uint32_t *pattern,
              uint32_t *dst, size_t dst_count, size_t n) {
    (void)out; (void)pattern; (void)dst; (void)dst_count; (void)n;
    return -2; /* TODO */
}

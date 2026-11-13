#include "transfer.h"

int plan_copy(job_t *out, const uint32_t *src, size_t src_count,
              uint32_t *dst, size_t dst_count, size_t n) {
    if (!out || !src || !dst || n == 0 || n > src_count || n > dst_count) {
        return -1;
    }
    job_t job = {src, dst, n, XFER_32, true, true};
    *out = job;
    return 0;
}

int plan_fill(job_t *out, const uint32_t *pattern,
              uint32_t *dst, size_t dst_count, size_t n) {
    if (!out || !pattern || !dst || n == 0 || n > dst_count) {
        return -1;
    }
    job_t job = {pattern, dst, n, XFER_32, false, true};
    *out = job;
    return 0;
}

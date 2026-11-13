#ifndef MOCK_EXAM_TRANSFER_H
#define MOCK_EXAM_TRANSFER_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef enum { XFER_8 = 1, XFER_16 = 2, XFER_32 = 4 } xfer_size_t;
typedef struct {
    const void *src;
    void *dst;
    size_t count;
    xfer_size_t size;
    bool src_increment;
    bool dst_increment;
} job_t;

int plan_copy(job_t *out, const uint32_t *src, size_t src_count,
              uint32_t *dst, size_t dst_count, size_t n);
int plan_fill(job_t *out, const uint32_t *pattern,
              uint32_t *dst, size_t dst_count, size_t n);

#endif

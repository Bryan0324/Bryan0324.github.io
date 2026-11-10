/* Host pthread example; not a bare-metal/IRQ synchronization recipe.
 * Build on Linux: cc -std=c11 -O2 -Wall -Wextra -pthread pthread_counter.c -o counter
 * Run: ./counter
 * Shared counter: protected by one mutex.
 * Worker checksum: local while running, read by main only after join.
 */
#include <inttypes.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { WORKERS = 2, ROUNDS = 20000 };

static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
static uint64_t counter;

typedef struct {
    uint64_t checksum;
} worker_result_t;

static void check(int error, const char *operation) {
    if (error != 0) {
        fprintf(stderr, "%s: %s\n", operation, strerror(error));
        exit(EXIT_FAILURE);
    }
}

static void *worker(void *arg) {
    worker_result_t *result = arg;
    uint64_t local = 0;
    for (unsigned i = 0; i < ROUNDS; ++i) {
        /* This work uses only local/immutable data. */
        local += i;
        check(pthread_mutex_lock(&lock), "pthread_mutex_lock");
        ++counter;
        check(pthread_mutex_unlock(&lock), "pthread_mutex_unlock");
    }
    result->checksum = local;
    return NULL;
}

int main(void) {
    pthread_t threads[WORKERS];
    worker_result_t results[WORKERS] = {0};
    for (unsigned i = 0; i < WORKERS; ++i) {
        check(pthread_create(&threads[i], NULL, worker, &results[i]),
              "pthread_create");
    }
    uint64_t combined = 0;
    for (unsigned i = 0; i < WORKERS; ++i) {
        check(pthread_join(threads[i], NULL), "pthread_join");
        combined += results[i].checksum;
    }
    const uint64_t expected_counter = (uint64_t)WORKERS * ROUNDS;
    const uint64_t expected_checksum = (uint64_t)WORKERS * ROUNDS * (ROUNDS - 1) / 2;
    printf("counter=%" PRIu64 " expected=%" PRIu64 "\n", counter, expected_counter);
    printf("checksum=%" PRIu64 " expected=%" PRIu64 "\n", combined, expected_checksum);
    check(pthread_mutex_destroy(&lock), "pthread_mutex_destroy");
    return counter == expected_counter && combined == expected_checksum
               ? EXIT_SUCCESS : EXIT_FAILURE;
}

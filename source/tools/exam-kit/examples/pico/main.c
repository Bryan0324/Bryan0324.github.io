/* Pico SDK template: memory DMA copy/fill, then PIO word echo.
 * No GPIO is used. Run standalone, or merge only the needed functions.
 */
#include <inttypes.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/dma.h"
#include "hardware/pio.h"
#include "exam_echo.pio.h"

enum { COUNT = 8 };

static bool dma_memory_check(void) {
    int ch = dma_claim_unused_channel(false);
    if (ch < 0) {
        puts("no free DMA channel");
        return false;
    }
    uint32_t source[COUNT];
    uint32_t dest[COUNT + 1];
    const uint32_t pattern = UINT32_C(0xa5a5a5a5);
    const uint32_t sentinel = UINT32_C(0x13579bdf);
    dma_channel_config config = dma_channel_get_default_config((uint)ch);
    channel_config_set_transfer_data_size(&config, DMA_SIZE_32);
    channel_config_set_write_increment(&config, true);
    channel_config_set_dreq(&config, DREQ_FORCE); /* Memory-to-memory only. */
    bool ok = true;
    for (unsigned round = 0; round < 2; ++round) {
        for (unsigned i = 0; i < COUNT; ++i) {
            source[i] = round * 100 + i;
            dest[i] = 0;
        }
        dest[COUNT] = sentinel;
        channel_config_set_read_increment(&config, true);
        /* Pico API order: destination BEFORE source; count is transfers. */
        dma_channel_configure((uint)ch, &config, dest, source, COUNT, true);
        dma_channel_wait_for_finish_blocking((uint)ch);
        for (unsigned i = 0; i < COUNT; ++i) ok = ok && dest[i] == source[i];
        ok = ok && dest[COUNT] == sentinel;

        channel_config_set_read_increment(&config, false);
        dma_channel_configure((uint)ch, &config, dest, &pattern, COUNT, true);
        dma_channel_wait_for_finish_blocking((uint)ch);
        for (unsigned i = 0; i < COUNT; ++i) ok = ok && dest[i] == pattern;
        ok = ok && dest[COUNT] == sentinel;
    }
    dma_channel_unclaim((uint)ch);
    return ok;
}

/* One request in flight: avoids filling TX while RX is left undrained.
 * On timeout the caller disables/removes this SM; do not reuse stale FIFOs.
 */
static bool exchange_word(PIO pio, uint sm, uint32_t sent, uint32_t *received) {
    uint64_t deadline = time_us_64() + UINT64_C(1000000);
    while (pio_sm_is_tx_fifo_full(pio, sm)) {
        if (time_us_64() >= deadline) return false;
        tight_loop_contents();
    }
    pio_sm_put(pio, sm, sent);
    while (pio_sm_is_rx_fifo_empty(pio, sm)) {
        if (time_us_64() >= deadline) return false;
        tight_loop_contents();
    }
    *received = pio_sm_get(pio, sm);
    return true;
}

static bool pio_echo_check(void) {
    PIO pio = pio0;
    int claimed = pio_claim_unused_sm(pio, false);
    if (claimed < 0) {
        puts("no free PIO state machine");
        return false;
    }
    uint sm = (uint)claimed;
    if (!pio_can_add_program(pio, &exam_echo_program)) {
        pio_sm_unclaim(pio, sm);
        puts("not enough PIO instruction memory");
        return false;
    }
    uint offset = pio_add_program(pio, &exam_echo_program);
    pio_sm_config config = exam_echo_program_get_default_config(offset);
    sm_config_set_out_shift(&config, true, true, 32);  /* right, autopull */
    sm_config_set_in_shift(&config, true, false, 32);  /* explicit push */
    sm_config_set_fifo_join(&config, PIO_FIFO_JOIN_NONE);
    sm_config_set_clkdiv(&config, 1.0f);
    pio_sm_init(pio, sm, offset, &config); /* disabled, FIFO/shift state reset */
    pio_sm_set_enabled(pio, sm, true);

    const uint32_t words[] = {0, UINT32_C(0x12345678), UINT32_C(0x89abcdef), UINT32_MAX};
    bool ok = true;
    for (unsigned round = 0; round < 2 && ok; ++round) {
        for (size_t i = 0; i < sizeof words / sizeof words[0]; ++i) {
            uint32_t received = 0;
            if (!exchange_word(pio, sm, words[i], &received) || received != words[i]) {
                printf("PIO mismatch/timeout: sent=%08" PRIx32 " received=%08" PRIx32 "\n",
                       words[i], received);
                ok = false;
                break;
            }
        }
    }
    sleep_us(10);
    ok = ok && pio_sm_is_rx_fifo_empty(pio, sm);
    pio_sm_set_enabled(pio, sm, false);
    pio_sm_clear_fifos(pio, sm);
    pio_remove_program(pio, &exam_echo_program, offset);
    pio_sm_unclaim(pio, sm);
    return ok;
}

int main(void) {
    stdio_init_all();
    sleep_ms(2000);
    bool dma_ok = dma_memory_check();
    bool pio_ok = pio_echo_check();
    printf("DMA copy/fill: %s\nPIO echo: %s\n",
           dma_ok ? "PASS" : "FAIL", pio_ok ? "PASS" : "FAIL");
    while (true) sleep_ms(1000);
}

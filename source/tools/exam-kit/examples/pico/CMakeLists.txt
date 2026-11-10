cmake_minimum_required(VERSION 3.13)

# Use the SDK already provided by the exam environment.
if(NOT PICO_SDK_PATH AND DEFINED ENV{PICO_SDK_PATH})
    set(PICO_SDK_PATH "$ENV{PICO_SDK_PATH}")
endif()
if(NOT EXISTS "${PICO_SDK_PATH}/external/pico_sdk_import.cmake")
    message(FATAL_ERROR "Set PICO_SDK_PATH to the installed Pico SDK")
endif()
include("${PICO_SDK_PATH}/external/pico_sdk_import.cmake")

project(exam_pico C CXX ASM)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)
pico_sdk_init()

add_executable(exam_pico main.c)
pico_generate_pio_header(exam_pico "${CMAKE_CURRENT_LIST_DIR}/exam_echo.pio")
target_link_libraries(exam_pico pico_stdlib hardware_pio hardware_dma)
pico_enable_stdio_usb(exam_pico 1)
pico_enable_stdio_uart(exam_pico 0)
pico_add_extra_outputs(exam_pico)

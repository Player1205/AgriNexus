cmake_minimum_required(VERSION 3.15...3.28)
project(safety_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find pybind11
find_package(pybind11 CONFIG REQUIRED)

# Create the module
pybind11_add_module(safety_engine safety_engine.cpp)

# Optimize for speed
target_compile_options(safety_engine PRIVATE -O3)

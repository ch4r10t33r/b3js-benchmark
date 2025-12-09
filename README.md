# BLAKE3 Benchmark Comparison

This directory contains benchmark scripts to compare different BLAKE3 implementations.

## Implementations Benchmarked

The benchmark compares the following BLAKE3 implementations:

1. **b3js** - Our optimized pure JavaScript implementation
2. **blake3-js** - Pure JavaScript implementation (npm: `blake3-js`)
3. **blake3** - Rust/WASM implementation (npm: `blake3`)
4. **blake3-fast** - WASM SIMD implementation (github: `Atamanov/blake3-fast`)
5. **blake3-numi2** - Pure JavaScript implementation (github: `Numi2/Blake3inJavasScript`)
6. **blake3-optimized** - Optimized JavaScript implementation (github: `lamb356/blake3-optimized`)
7. **bk3js** - JavaScript implementation with WASM support (github: `chimmykk/Bk3JS`)

## Setup

```bash
# Install dependencies
bun install

# Or if using npm
npm install
```

**Note:** The benchmark script expects `b3js` to be installed as a package. 
The other implementations will be installed via npm/bun from their respective sources.

## Running Benchmarks

```bash
bun run benchmark.ts
```

To save results to a file:

```bash
bun run benchmark.ts > benchmark-results.txt
```

## What Gets Benchmarked

1. **Small inputs** (11 bytes) - Common use case
2. **Medium inputs** (1KB) - Typical file chunks
3. **Large inputs** (100KB) - Medium files
4. **Very large inputs** (1MB) - Large files
5. **Streaming** - Incremental hashing performance

## Output

The benchmark will show:
- Total time for all iterations
- Average time per operation
- Throughput (operations per second)
- Relative performance compared to fastest
- Correctness verification (hash output comparison)

## Requirements

- Node.js/Bun runtime
- The `b3js` package should be available (installed from npm)
- Other implementations will be installed via npm/bun

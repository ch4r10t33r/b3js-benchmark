# BLAKE3 Benchmark Comparison

This directory contains benchmark scripts to compare different BLAKE3 implementations:

- **b3js** - Our optimized pure JavaScript implementation
- **blake3-js** - Pure JavaScript implementation
- **blake3** - Rust/WASM implementation

## Setup

```bash
# Install dependencies
bun install

# Or if using npm
npm install
```

**Note:** The benchmark script expects `b3js` to be in a sibling directory (`../b3js/`). 
If you've installed `b3js` as a package, update the import in `benchmark.ts` accordingly.

## Running Benchmarks

```bash
bun run benchmark.ts
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
- The `b3js` package should be available in the parent directory or installed
- Other implementations will be installed via npm/bun


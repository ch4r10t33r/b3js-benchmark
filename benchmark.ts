/**
 * BLAKE3 Implementation Benchmark Comparison
 * 
 * Compares:
 * - b3js (our optimized implementation)
 * - blake3-js (pure JS implementation)
 * - blake3 (Rust/WASM implementation)
 * - blake3-fast (WASM SIMD implementation)
 * - blake3-numi2 (Numi2's pure JS implementation)
 * - blake3-optimized (lamb356's optimized JS implementation)
 * - bk3js (chimmykk's JS implementation)
 */

// Import b3js from package
import { hash as b3jsHash, createHasher as b3jsCreateHasher } from 'b3js';

// Dynamic imports for other implementations
let blake3jsHash: ((input: Uint8Array | string) => Uint8Array) | null = null;
let blake3jsCreateHasher: (() => any) | null = null;
let blake3Hash: ((input: Uint8Array | string) => Uint8Array) | null = null;
let blake3CreateHasher: (() => any) | null = null;
let blake3FastHash: ((input: Uint8Array | string) => Uint8Array) | null = null;
let blake3FastCreateHasher: (() => any) | null = null;
let blake3Numi2Hash: ((input: Uint8Array | string) => Uint8Array) | null = null;
let blake3OptimizedHash: ((input: Uint8Array | string) => Uint8Array) | null = null;
let bk3jsHash: ((input: Uint8Array | string) => Uint8Array) | null = null;

async function loadImplementations() {
  try {
    const blake3js = await import('blake3-js');
    // Helper to convert hex string to Uint8Array
    const hexToBytes = (hex: string): Uint8Array => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      return bytes;
    };
    blake3jsHash = (input: Uint8Array | string) => {
      const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
      const hasher = blake3js.newRegular();
      hasher.update(data);
      const hexResult = hasher.finalize();
      return hexToBytes(hexResult);
    };
    blake3jsCreateHasher = () => {
      const hasher = blake3js.newRegular();
      const wrapper = {
        update: (data: Uint8Array | string) => {
          const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
          hasher.update(bytes);
          return wrapper;
        },
        finalize: () => {
          const hexResult = hasher.finalize();
          return hexToBytes(hexResult);
        }
      };
      return wrapper;
    };
    console.log('✓ Loaded blake3-js');
  } catch (e) {
    console.log('✗ Failed to load blake3-js:', e);
  }

  try {
    const blake3 = await import('blake3');
    blake3Hash = (input: Uint8Array | string) => {
      const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
      return blake3.hash(data);
    };
    blake3CreateHasher = () => blake3.createHash();
    console.log('✓ Loaded blake3 (Rust/WASM)');
  } catch (e) {
    console.log('✗ Failed to load blake3:', e);
  }

  try {
    const blake3Fast = await import('blake3-fast');
    blake3FastHash = (input: Uint8Array | string) => {
      const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
      return blake3Fast.hash(data);
    };
    blake3FastCreateHasher = () => {
      const hasher = blake3Fast.createHash();
      const wrapper = {
        update: (data: Uint8Array | string) => {
          const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
          hasher.update(bytes);
          return wrapper;
        },
        digest: () => hasher.digest()
      };
      return wrapper;
    };
    console.log('✓ Loaded blake3-fast (WASM SIMD)');
  } catch (e) {
    console.log('✗ Failed to load blake3-fast:', e);
  }

  try {
    // Blake3inJavasScript - single file implementation with ESM exports
    const blake3Numi2 = await import('blake3-numi2/blake3.js');
    blake3Numi2Hash = (input: Uint8Array | string) => {
      const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
      return blake3Numi2.hash(data);
    };
    console.log('✓ Loaded blake3-numi2');
  } catch (e) {
    console.log('✗ Failed to load blake3-numi2:', e);
  }

  try {
    // blake3-optimized - CommonJS style
    const blake3Optimized = await import('blake3-optimized/blake3.js');
    blake3OptimizedHash = (input: Uint8Array | string) => {
      const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
      // Handle both default export and named export
      const hashFn = blake3Optimized.default?.hash || blake3Optimized.hash;
      return hashFn(data);
    };
    console.log('✓ Loaded blake3-optimized');
  } catch (e) {
    console.log('✗ Failed to load blake3-optimized:', e);
  }

  try {
    // bk3js - check the actual export structure
    const bk3js = await import('bk3js/blake3.js');
    // Try different export patterns
    const hashFn = bk3js.default?.hash || bk3js.hash || (bk3js as any).hash;
    if (hashFn) {
      bk3jsHash = (input: Uint8Array | string) => {
        const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
        return hashFn(data);
      };
      console.log('✓ Loaded bk3js');
    } else {
      console.log('✗ Failed to load bk3js: hash function not found');
    }
  } catch (e) {
    console.log('✗ Failed to load bk3js:', e);
  }
}

interface BenchmarkResult {
  name: string;
  total: number;
  avg: number;
  throughput: number;
  ops: number;
}

function benchmark(
  name: string,
  fn: () => void,
  iterations: number = 1000
): BenchmarkResult {
  // Warmup
  for (let i = 0; i < Math.min(10, iterations); i++) {
    fn();
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const total = end - start;
  const avg = total / iterations;
  const throughput = (iterations / total) * 1000;

  return { name, total, avg, throughput, ops: iterations };
}

function formatResult(result: BenchmarkResult): string {
  const mbps = result.throughput > 0 ? (result.throughput / 1000000).toFixed(2) : '0.00';
  return `${result.name.padEnd(25)} ${result.total.toFixed(2)}ms | ${result.avg.toFixed(4)}ms/op | ${result.throughput.toFixed(0)} ops/sec`;
}

function compareResults(results: BenchmarkResult[]): void {
  if (results.length === 0) return;

  // Find fastest
  const fastest = results.reduce((a, b) => (a.throughput > b.throughput ? a : b));
  
  console.log('\n' + '='.repeat(100));
  console.log('Results:');
  console.log('='.repeat(100));
  
  for (const result of results) {
    const speedup = result.throughput > 0 ? (fastest.throughput / result.throughput).toFixed(2) : 'N/A';
    const marker = result === fastest ? ' 🏆' : '';
    const relative = result.throughput > 0 
      ? `${((result.throughput / fastest.throughput) * 100).toFixed(1)}%`
      : 'N/A';
    console.log(`${formatResult(result)} | ${relative} of fastest | ${speedup}x slower${marker}`);
  }
  console.log('='.repeat(100));
}

async function runBenchmarks() {
  console.log('BLAKE3 Implementation Benchmark Comparison\n');
  console.log('Loading implementations...\n');
  
  await loadImplementations();
  
  console.log('\n' + '='.repeat(100));
  console.log('Benchmark Suite');
  console.log('='.repeat(100) + '\n');

  const testCases = [
    { name: 'Small (11 bytes)', data: 'hello world', iterations: 10000 },
    { name: 'Medium (1KB)', data: 'a'.repeat(1024), iterations: 1000 },
    { name: 'Large (100KB)', data: 'a'.repeat(100 * 1024), iterations: 100 },
    { name: 'Very Large (1MB)', data: 'a'.repeat(1024 * 1024), iterations: 10 },
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Test: ${testCase.name}`);
    console.log('-'.repeat(100));
    
    const results: BenchmarkResult[] = [];
    const data = testCase.data;
    const dataBytes = new TextEncoder().encode(data);

    // b3js
    results.push(benchmark('b3js', () => {
      b3jsHash(data);
    }, testCase.iterations));

    // blake3-js
    if (blake3jsHash) {
      results.push(benchmark('blake3-js', () => {
        blake3jsHash!(data);
      }, testCase.iterations));
    }

    // blake3 (Rust/WASM)
    if (blake3Hash) {
      results.push(benchmark('blake3 (Rust/WASM)', () => {
        blake3Hash!(data);
      }, testCase.iterations));
    }

    // blake3-fast (WASM SIMD)
    if (blake3FastHash) {
      results.push(benchmark('blake3-fast (WASM SIMD)', () => {
        blake3FastHash!(data);
      }, testCase.iterations));
    }

    // blake3-numi2
    if (blake3Numi2Hash) {
      results.push(benchmark('blake3-numi2', () => {
        blake3Numi2Hash!(data);
      }, testCase.iterations));
    }

    // blake3-optimized
    if (blake3OptimizedHash) {
      results.push(benchmark('blake3-optimized', () => {
        blake3OptimizedHash!(data);
      }, testCase.iterations));
    }

    // bk3js
    if (bk3jsHash) {
      results.push(benchmark('bk3js', () => {
        bk3jsHash!(data);
      }, testCase.iterations));
    }

    compareResults(results);
  }

  // Streaming benchmark
  console.log(`\n📊 Test: Streaming (100 chunks of 1KB each)`);
  console.log('-'.repeat(100));
  
  const streamingResults: BenchmarkResult[] = [];
  const chunk = 'a'.repeat(1024);
  const iterations = 100;

  // b3js streaming
  streamingResults.push(benchmark('b3js (streaming)', () => {
    const hasher = b3jsCreateHasher();
    for (let i = 0; i < 100; i++) {
      hasher.update(chunk);
    }
    hasher.finalize();
  }, iterations));

  // blake3-js streaming
  if (blake3jsCreateHasher) {
    streamingResults.push(benchmark('blake3-js (streaming)', () => {
      const hasher = blake3jsCreateHasher!();
      for (let i = 0; i < 100; i++) {
        hasher.update(chunk);
      }
      hasher.finalize();
    }, iterations));
  }

  // blake3 streaming
  if (blake3CreateHasher) {
    streamingResults.push(benchmark('blake3 (streaming)', () => {
      const hasher = blake3CreateHasher!();
      for (let i = 0; i < 100; i++) {
        hasher.update(chunk);
      }
      hasher.digest();
    }, iterations));
  }

  // blake3-fast streaming
  if (blake3FastCreateHasher) {
    streamingResults.push(benchmark('blake3-fast (streaming)', () => {
      const hasher = blake3FastCreateHasher!();
      for (let i = 0; i < 100; i++) {
        hasher.update(chunk);
      }
      hasher.digest();
    }, iterations));
  }

  compareResults(streamingResults);

  // Verify correctness
  console.log('\n' + '='.repeat(100));
  console.log('Correctness Verification');
  console.log('='.repeat(100));
  
  const testInput = 'hello world';
  const b3jsResult = Array.from(b3jsHash(testInput)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log(`b3js:        ${b3jsResult}`);
  
  if (blake3jsHash) {
    const blake3jsResult = Array.from(blake3jsHash(testInput)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`blake3-js:   ${blake3jsResult}`);
    console.log(`Match: ${b3jsResult === blake3jsResult ? '✓' : '✗'}`);
  }
  
  if (blake3Hash) {
    const blake3Result = Array.from(blake3Hash(testInput)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`blake3:      ${blake3Result}`);
    console.log(`Match: ${b3jsResult === blake3Result ? '✓' : '✗'}`);
  }

  if (blake3FastHash) {
    const blake3FastResult = Array.from(blake3FastHash(testInput)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`blake3-fast: ${blake3FastResult}`);
    console.log(`Match: ${b3jsResult === blake3FastResult ? '✓' : '✗'}`);
  }

  if (blake3Numi2Hash) {
    const blake3Numi2Result = Array.from(blake3Numi2Hash(testInput)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`blake3-numi2: ${blake3Numi2Result}`);
    console.log(`Match: ${b3jsResult === blake3Numi2Result ? '✓' : '✗'}`);
  }

  if (blake3OptimizedHash) {
    const blake3OptimizedResult = Array.from(blake3OptimizedHash(testInput)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`blake3-optimized: ${blake3OptimizedResult}`);
    console.log(`Match: ${b3jsResult === blake3OptimizedResult ? '✓' : '✗'}`);
  }

  if (bk3jsHash) {
    const bk3jsResult = Array.from(bk3jsHash(testInput)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`bk3js: ${bk3jsResult}`);
    console.log(`Match: ${b3jsResult === bk3jsResult ? '✓' : '✗'}`);
  }

  console.log('\n' + '='.repeat(100));
  console.log('Benchmark Complete!');
  console.log('='.repeat(100));
  console.log('\nNote: Results may vary based on:');
  console.log('  - JavaScript engine and version');
  console.log('  - CPU architecture and features');
  console.log('  - System load and thermal state');
  console.log('  - Input size and memory alignment');
}

runBenchmarks().catch(console.error);


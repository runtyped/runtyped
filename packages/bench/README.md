# @runtyped/bench

```typescript
// benchmarks/test.ts
import { benchmark, run } from '@runtyped/bench';

let i = 0;

benchmark('test', () => {
    i += 10;
});

void run();
```

```sh
node --import @runtyped/run benchmarks/test.ts 
```

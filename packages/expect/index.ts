
import { Expect } from './src/expect.js';

export const expect = <T>(actual: T) => new Expect<T>(actual);

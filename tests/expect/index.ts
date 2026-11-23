
import { Expect } from './expect.js';

export const expect = <T>(actual: T) => new Expect<T>(actual);

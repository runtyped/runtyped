import { AutoIncrement, PrimaryKey } from './reflection/type.js';
import { Positive } from './type-annotations.js';

export type AutoId = number & PrimaryKey & AutoIncrement & Positive;

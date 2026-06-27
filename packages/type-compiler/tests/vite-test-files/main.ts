import { type ReceiveType, resolveReceiveType } from '@runtyped/type';
import { CreateUserData } from './shared.js';

function fn<T>(t?: ReceiveType<T>) {
    return resolveReceiveType(t);
}

fn<CreateUserData>();

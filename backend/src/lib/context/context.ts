// lib/context.ts
import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from './context.type';

export const context = new AsyncLocalStorage<RequestContext>();

export const getCurrentUser = (): RequestContext => {
    return context.getStore() ?? { userId: '', email: '' };
};

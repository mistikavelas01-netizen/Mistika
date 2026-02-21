import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  method: string;
  path: string;
  route?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = async <T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> => storage.run(context, fn);

export const getRequestContext = (): RequestContext | undefined => storage.getStore();

import { Context, Middleware } from 'grammy';
import { EditOrReplyFlavor } from './types';
import { editOrReply } from './edit-or-reply';

/**
 * Registers editOrReply as part of the context for simpler usage.
 */
export function editOrReplyMiddleware<C extends Context>(): Middleware<
  C & EditOrReplyFlavor
> {
  return async (ctx, next) => {
    ctx.editOrReply = (messageData) => editOrReply(ctx, messageData);
    await next();
  };
}

import { Context, MiddlewareFn } from 'https://deno.land/x/grammy@v1.25.0/mod.ts';
import { EditOrReplyFlavor, messageDataHasMedia } from './types.ts';
import { editOrReply } from './edit-or-reply.ts';
import { getMessageInfo } from './message-info.ts';

/**
 * Registers editOrReply as part of the context for simpler usage.
 */
export function editOrReplyMiddleware<C extends Context>(): MiddlewareFn<
  C & EditOrReplyFlavor
> {
  return async (ctx, next) => {
    (ctx.editOrReply = (messageData, oldMessageInfo) =>
      editOrReply(
        ctx.api,
        messageData,
        oldMessageInfo ?? getMessageInfo(ctx, messageDataHasMedia(messageData))
      )),
      (ctx.getMessageInfo = (guessedHasMedia = false) =>
        getMessageInfo(ctx, guessedHasMedia));
    await next();
  };
}

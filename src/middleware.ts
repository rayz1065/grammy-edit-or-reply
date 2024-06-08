import { Context, MiddlewareFn } from 'grammy';
import { EditOrReplyFlavor, messageDataHasMedia } from './types';
import { editOrReply } from './edit-or-reply';
import { getMessageInfo } from './message-info';

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

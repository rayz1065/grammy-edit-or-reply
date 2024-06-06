import { Context } from 'grammy';
import { MessageMediaInfo, OldMessageInfo } from './types';
import { Message } from 'grammy/types';

/**
 * Retrieves the media of the message, if any.
 */
export function getMessageMediaInfo(message: Message): MessageMediaInfo | null {
  if (message.photo) {
    return {
      type: 'photo',
      media: message.photo.at(-1)!,
      sizes: message.photo,
      fileId: message.photo[0].file_id,
    };
  } else if (message.animation) {
    return {
      type: 'animation',
      media: message.animation,
      fileId: message.animation.file_id,
    };
  } else if (message.audio) {
    return {
      type: 'audio',
      media: message.audio,
      fileId: message.audio.file_id,
    };
  } else if (message.document) {
    return {
      type: 'document',
      media: message.document,
      fileId: message.document.file_id,
    };
  } else if (message.video) {
    return {
      type: 'video',
      media: message.video,
      fileId: message.video.file_id,
    };
  } else {
    return null;
  }
}

/**
 * Tries to retrieve the info of the old message from the context.
 *
 * If the message from the callback is inaccessible or the callback belongs to
 * an inline message it will make a guess on whether the old message had a
 * media, pass `guessedHasMedia` if the guess should be true.
 */
export function getMessageInfo<C extends Context>(
  ctx: C,
  guessedHasMedia = false
): OldMessageInfo {
  if (ctx.callbackQuery) {
    const { inline_message_id: inlineMessageId, message } = ctx.callbackQuery;
    if (inlineMessageId) {
      // cannot determine whether the old message has media
      return { inlineMessageId, hasMedia: guessedHasMedia };
    }

    if (!message?.message_id) {
      throw new Error('message_id is absent from the message');
    }

    if (message.date === 0) {
      // inaccessible message, cannot determine whether it has media
      return {
        chatId: message.chat.id,
        messageId: message.message_id,
        hasMedia: guessedHasMedia,
      };
    }

    const media = getMessageMediaInfo(message);
    return {
      chatId: message.chat.id,
      messageId: message.message_id,
      hasMedia: media !== null,
    };
  }

  if (!ctx.chat) {
    throw new Error('chat is absent from the update');
  }

  return {
    chatId: ctx.chat.id,
  };
}

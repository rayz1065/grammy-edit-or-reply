import assert from 'node:assert';
import { Api } from 'https://deno.land/x/grammy@v1.24.0/mod.ts';
import { InputMedia } from 'https://deno.land/x/grammy@v1.24.0/types.ts';
import {
  EditOrReplyResult,
  MediaType,
  MessageData,
  MessageDataMedia,
  OldMessageInfo,
  OldMessageInfoChat,
  OldMessageInfoChatMessage,
  SendMediaResult,
  TelegramOther,
  messageDataHasMedia,
  oldMessageIsInline,
  oldMessageIsMessage,
} from './types.ts';

/**
 * Creates the `other` parameter with the specified keys.
 */
export function makeOther<T extends (keyof TelegramOther)[]>(
  messageData: MessageData,
  keys: T
): Pick<TelegramOther, T[number]> {
  const other = {} as Pick<TelegramOther, T[number]>;

  const keysMap = {
    caption: 'text',
    caption_entities: 'entities',
    reply_markup: 'keyboard',
  } as const satisfies Record<
    Exclude<keyof TelegramOther, keyof MessageData>,
    keyof MessageData
  >;

  keys.forEach((key: T[number]) => {
    const remapped = (
      key in keysMap ? keysMap[key as keyof typeof keysMap] : key
    ) as keyof MessageData;

    if (remapped in messageData) {
      if (remapped === 'keyboard') {
        other[key] = {
          inline_keyboard: messageData.keyboard,
        } as any;
      } else {
        other[key] = messageData[remapped] as any;
      }
    }
  });

  return other;
}

/**
 * Creates the input media, adding available properties
 */
export function makeInputMedia(messageData: MessageDataMedia): InputMedia {
  const other: Parameters<typeof makeOther>[1] = [
    'parse_mode',
    'caption',
    'caption_entities',
  ];

  if (
    (['animation', 'photo', 'video'] as MediaType[]).includes(
      messageData.media.type
    )
  ) {
    other.push('has_spoiler', 'show_caption_above_media');
  }

  return {
    ...messageData.media,
    ...makeOther(messageData, other),
  };
}

/**
 * Sends a media to the specified chat in a new message
 */
export async function sendMedia(
  api: Api,
  messageData: MessageDataMedia,
  oldMessageInfo: OldMessageInfoChat | OldMessageInfoChatMessage
): Promise<SendMediaResult> {
  const { chatId } = oldMessageInfo;
  const {
    media: { media, type: mediaType },
  } = messageData;

  const defaultOther = [
    'business_connection_id',
    'disable_notification',
    'message_thread_id',
    'protect_content',
    'reply_markup',
    'reply_parameters',
    'message_effect_id',
    'parse_mode',
    'caption',
    'caption_entities',
  ] as const satisfies (keyof TelegramOther)[];

  if (mediaType === 'photo') {
    return await api.sendPhoto(
      chatId,
      media,
      makeOther(messageData, [
        ...defaultOther,
        'has_spoiler',
        'show_caption_above_media',
      ])
    );
  } else if (mediaType === 'animation') {
    return await api.sendAnimation(
      chatId,
      media,
      makeOther(messageData, [
        ...defaultOther,
        'has_spoiler',
        'show_caption_above_media',
      ])
    );
  } else if (mediaType === 'audio') {
    return await api.sendAudio(
      chatId,
      media,
      makeOther(messageData, defaultOther)
    );
  } else if (mediaType === 'document') {
    return await api.sendDocument(
      chatId,
      media,
      makeOther(messageData, defaultOther)
    );
  } else if (mediaType === 'video') {
    return await api.sendVideo(
      chatId,
      media,
      makeOther(messageData, [
        ...defaultOther,
        'has_spoiler',
        'show_caption_above_media',
      ])
    );
  } else {
    throw new Error(`Unsupported media type: ${mediaType as string}`);
  }
}

/**
 * Tries deleting the specified message, does **not** throw an error on failure
 */
export function deleteStaleMessage(
  api: Api,
  oldMessageInfo: OldMessageInfoChatMessage
) {
  api
    .deleteMessage(oldMessageInfo.chatId, oldMessageInfo.messageId)
    .catch(() => {});
}

/**
 * Use this when context is not available but you still have data regarding the
 * message that needs to be edited (if any).
 */
export async function editOrReply(
  api: Api,
  messageData: MessageData,
  oldMessageInfo: OldMessageInfo
): Promise<EditOrReplyResult> {
  if (oldMessageIsInline(oldMessageInfo)) {
    const { inlineMessageId, hasMedia } = oldMessageInfo;

    if (!hasMedia && messageDataHasMedia(messageData)) {
      throw Error(
        'Original inline message had no media, ' +
          'but trying to add a media while editing'
      );
    }

    if (hasMedia && messageDataHasMedia(messageData)) {
      // we can edit the media as well
      return await api.editMessageMediaInline(
        inlineMessageId,
        makeInputMedia(messageData),
        makeOther(messageData, ['business_connection_id', 'reply_markup'])
      );
    } else if (hasMedia) {
      // we can't remove the media, but we can still try changing the caption
      return await api.editMessageCaptionInline(
        inlineMessageId,
        makeOther(messageData, [
          'business_connection_id',
          'reply_markup',
          'parse_mode',
          'caption',
          'caption_entities',
        ])
      );
    } else {
      // we can simply edit the text
      assert(!messageDataHasMedia(messageData));
      return await api.editMessageTextInline(
        inlineMessageId,
        messageData.text,
        makeOther(messageData, [
          'business_connection_id',
          'entities',
          'link_preview_options',
          'reply_markup',
          'parse_mode',
        ])
      );
    }
  }

  if (oldMessageIsMessage(oldMessageInfo)) {
    const { chatId, hasMedia, messageId } = oldMessageInfo;

    if (hasMedia && messageDataHasMedia(messageData)) {
      // we can edit the media as well
      return await api.editMessageMedia(
        chatId,
        messageId,
        makeInputMedia(messageData),
        makeOther(messageData, ['business_connection_id', 'reply_markup'])
      );
    } else if (hasMedia) {
      // delete the existing message, send a new one without media
      assert(!messageDataHasMedia(messageData));
      const result = await api.sendMessage(
        chatId,
        messageData.text,
        makeOther(messageData, [
          'business_connection_id',
          'disable_notification',
          'entities',
          'link_preview_options',
          'parse_mode',
          'protect_content',
          'reply_markup',
          'reply_parameters',
          'message_effect_id',
        ])
      );
      deleteStaleMessage(api, oldMessageInfo);
      return result;
    } else if (messageDataHasMedia(messageData)) {
      // send the media to the chat
      const result = await sendMedia(api, messageData, oldMessageInfo);
      deleteStaleMessage(api, oldMessageInfo);
      return result;
    } else {
      // neither have media, we can edit the message text
      assert(!messageDataHasMedia(messageData));
      const { text } = messageData;
      return await api.editMessageText(
        chatId,
        messageId,
        text,
        makeOther(messageData, [
          'business_connection_id',
          'entities',
          'link_preview_options',
          'parse_mode',
          'reply_markup',
        ])
      );
    }
  }

  // no option but to send the message to the chat
  const { chatId } = oldMessageInfo;
  if (!messageDataHasMedia(messageData)) {
    // send message without media
    return await api.sendMessage(
      chatId,
      messageData.text,
      makeOther(messageData, [
        'business_connection_id',
        'disable_notification',
        'entities',
        'link_preview_options',
        'message_thread_id',
        'parse_mode',
        'protect_content',
        'reply_markup',
        'reply_parameters',
        'message_effect_id',
      ])
    );
  } else {
    // send the media to the chat
    return await sendMedia(api, messageData, oldMessageInfo);
  }
}

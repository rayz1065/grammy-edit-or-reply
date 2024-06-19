import { Api } from 'https://deno.land/x/grammy@v1.24.0/mod.ts';
import {
  Animation,
  Audio,
  Document,
  InlineKeyboardButton,
  InputFile,
  LinkPreviewOptions,
  MessageEntity,
  ParseMode,
  PhotoSize,
  ReplyParameters,
  Video,
  InlineQueryResultArticle,
  InlineQueryResultCachedDocument,
  InlineQueryResultCachedPhoto,
  InlineQueryResultCachedVideo,
  InlineQueryResultCachedGif,
} from 'https://deno.land/x/grammy@v1.24.0/types.ts';

export type Other = {
  keyboard?: InlineKeyboardButton[][];
  parse_mode?: ParseMode;
  entities?: MessageEntity[];
  link_preview_options?: LinkPreviewOptions;
  disable_notification?: boolean;
  protect_content?: boolean;
  message_thread_id?: number;
  business_connection_id?: string;
  has_spoiler?: boolean;
  reply_parameters?: ReplyParameters;
  message_effect_id?: string;
  show_caption_above_media?: boolean;
};

export type TelegramOther = {
  reply_markup?: { inline_keyboard: InlineKeyboardButton[][] };
  parse_mode?: ParseMode;
  entities?: MessageEntity[];
  link_preview_options?: LinkPreviewOptions;
  disable_notification?: boolean;
  protect_content?: boolean;
  message_thread_id?: number;
  business_connection_id?: string;
  has_spoiler?: boolean;
  reply_parameters?: ReplyParameters;
  message_effect_id?: string;
  show_caption_above_media?: boolean;

  // caption
  caption?: string;
  caption_entities?: MessageEntity[];
};

export type MessageMediaInfo =
  | {
      type: 'photo';
      media: PhotoSize;
      sizes: PhotoSize[];
      fileId: string;
    }
  | {
      type: 'animation';
      media: Animation;
      fileId: string;
    }
  | {
      type: 'audio';
      media: Audio;
      fileId: string;
    }
  | {
      type: 'document';
      media: Document;
      fileId: string;
    }
  | {
      type: 'video';
      media: Video;
      fileId: string;
    };

export type MediaType = MessageMediaInfo['type'];

export type MessageDataMedia = {
  text?: string;
  media: {
    type: MediaType;
    media: InputFile | string;
  };
} & Other;

export type MessageDataText = {
  text: string;
} & Other;

export type MessageData = MessageDataMedia | MessageDataText;

export function messageDataHasMedia(
  messageData: MessageData
): messageData is MessageDataMedia {
  return 'media' in messageData && messageData.media !== undefined;
}

/**
 * Checks that the message data has no input file.
 * This is required for `makeInlineResult`.
 */
export function messageDataHasNoInputFile(
  messageData: MessageData
): messageData is
  | MessageDataText
  | (MessageDataMedia & { media: { media: string } }) {
  return (
    !messageDataHasMedia(messageData) ||
    typeof messageData.media.media === 'string'
  );
}

export type OldMessageInfoChatMessage = {
  hasMedia: boolean;
  chatId: number;
  messageId: number;
};

export type OldMessageInfoChat = {
  chatId: number;
};

export type OldMessageInfoInline = {
  hasMedia: boolean;
  inlineMessageId: string;
};

export type OldMessageInfo =
  | OldMessageInfoChat
  | OldMessageInfoInline
  | OldMessageInfoChatMessage;

export function oldMessageIsInline(
  oldMessageInfo: OldMessageInfo
): oldMessageInfo is OldMessageInfoInline {
  return (
    'inlineMessageId' in oldMessageInfo &&
    oldMessageInfo.inlineMessageId !== undefined
  );
}

export function oldMessageIsMessage(
  oldMessageInfo: OldMessageInfo
): oldMessageInfo is OldMessageInfoChatMessage {
  return (
    'messageId' in oldMessageInfo && oldMessageInfo.messageId !== undefined
  );
}

export function oldMessageIsChat(
  oldMessageInfo: OldMessageInfo
): oldMessageInfo is OldMessageInfoChat {
  return (
    'chatId' in oldMessageInfo &&
    oldMessageInfo.chatId !== undefined &&
    !oldMessageIsMessage(oldMessageInfo)
  );
}

export type SendMediaResult = Awaited<
  ReturnType<
    Api[
      | 'sendPhoto'
      | 'sendAnimation'
      | 'sendAudio'
      | 'sendDocument'
      | 'sendVideo']
  >
>;

export type EditOrReplyResult =
  | SendMediaResult
  | Awaited<
      ReturnType<
        Api[
          | 'editMessageMediaInline'
          | 'editMessageCaptionInline'
          | 'editMessageTextInline'
          | 'editMessageMedia'
          | 'editMessageText'
          | 'sendMessage']
      >
    >;

type DistributiveOmit<T, K extends string | number | symbol> = T extends unknown
  ? Omit<T, K>
  : never;

export type MakeInlineResultReturn = DistributiveOmit<
  | InlineQueryResultArticle
  | InlineQueryResultCachedDocument
  | InlineQueryResultCachedPhoto
  | InlineQueryResultCachedVideo
  | InlineQueryResultCachedGif,
  'id' | 'title'
>;

export type EditOrReplyFlavor = {
  /**
   * Edits or sends a message to the current chat. The data of the current
   * message is obtained through `getMessageInfo`. If the message is inaccessible
   * or the update is a callback on an inline message it will make an
   * optimistic guess that the edit will succeed (i.e. the old message has a
   * media if the new one also does, same for the converse).
   *
   * You can pass the oldMessageInfo if you have it.
   */
  editOrReply: (
    messageData: MessageData,
    oldMessageInfo?: OldMessageInfo
  ) => Promise<EditOrReplyResult>;
  getMessageInfo: (guessedHasMedia?: boolean) => OldMessageInfo;
};

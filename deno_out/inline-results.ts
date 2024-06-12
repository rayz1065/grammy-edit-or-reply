import { makeOther } from './edit-or-reply.ts';
import {
  MessageDataText,
  MessageDataMedia,
  messageDataHasMedia,
  MakeInlineResultReturn,
} from './types.ts';

/**
 * Create an InlineResult for the given message specification.
 *
 * If a media is present it must be a `fileId`, as `InputFile`s are not
 * supported in inline results, and URLs would require extra metadata.
 * Use `messageDataHasNoInputFile` to help narrowing the type.
 */
export function makeInlineResult(
  messageData:
    | MessageDataText
    | (MessageDataMedia & {
        media: {
          media: string;
        };
      })
): MakeInlineResultReturn {
  if (!messageDataHasMedia(messageData)) {
    return {
      type: 'article',
      input_message_content: {
        message_text: messageData.text,
        ...makeOther(messageData, [
          'parse_mode',
          'entities',
          'link_preview_options',
        ]),
      },
      ...makeOther(messageData, ['reply_markup']),
    };
  }

  const mediaData = messageData.media;
  const { type: mediaType } = mediaData;
  const mediaFileId = mediaData.media;

  const defaultOther = [
    'caption',
    'parse_mode',
    'caption_entities',
    'reply_markup',
  ] satisfies Parameters<typeof makeOther>[1];

  if (mediaType === 'animation') {
    return {
      type: 'gif',
      gif_file_id: mediaFileId,
      ...makeOther(messageData, defaultOther),
    };
  } else if (mediaType === 'document') {
    return {
      type: 'document',
      document_file_id: mediaFileId,
      ...makeOther(messageData, defaultOther),
    };
  } else if (mediaType === 'audio') {
    return {
      // NOTE: even using files that are already uploaded on telegram
      // it can happen that 'Bad Request: AUDIO_TITLE_EMPTY' is returned,
      // to avoid this issue we send the media as document.
      type: 'document',
      document_file_id: mediaFileId,
      ...makeOther(messageData, defaultOther),
    };
  } else if (mediaType === 'photo') {
    return {
      type: 'photo',
      photo_file_id: mediaFileId,
      ...makeOther(messageData, [...defaultOther, 'show_caption_above_media']),
    };
  } else if (mediaType === 'video') {
    return {
      type: 'video',
      video_file_id: mediaFileId,
      ...makeOther(messageData, [...defaultOther, 'show_caption_above_media']),
    };
  } else {
    throw Error(`Unsupported media type: ${mediaType}`);
  }
}

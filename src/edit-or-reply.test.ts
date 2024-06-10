// @denoify-ignore
import { Api, Transformer } from 'grammy';
import {
  editOrReply,
  makeInputMedia,
  makeOther,
  sendMedia,
} from './edit-or-reply';
import { InputMedia } from 'grammy/types';

function getApi() {
  const api = new Api('12345:ABCDE');

  // mock calls
  const apiCall = jest.fn(
    (async () => ({ ok: true, result: true }) as any) as Transformer
  );
  api.config.use(apiCall);

  return { apiCall, api };
}

test('should use the right method to send media', async () => {
  const { api, apiCall } = getApi();

  const medias: InputMedia[] = [
    { media: '1', type: 'photo' },
    { media: '1', type: 'video' },
    { media: '1', type: 'animation' },
    { media: '1', type: 'document' },
    { media: '1', type: 'audio' },
  ];

  for (const media of medias) {
    await sendMedia(api, { media }, { chatId: 12345 });
  }

  expect(apiCall.mock.calls[0][1]).toBe('sendPhoto');
  expect(apiCall.mock.calls[1][1]).toBe('sendVideo');
  expect(apiCall.mock.calls[2][1]).toBe('sendAnimation');
  expect(apiCall.mock.calls[3][1]).toBe('sendDocument');
  expect(apiCall.mock.calls[4][1]).toBe('sendAudio');
});

test('should replace an existing message', async () => {
  const { api, apiCall } = getApi();

  // replace media with text
  await editOrReply(
    api,
    { text: 'hello' },
    { chatId: 123, hasMedia: true, messageId: 456 }
  );

  expect(apiCall.mock.calls[0][1]).toBe('sendMessage');
  expect(apiCall.mock.calls[1][1]).toBe('deleteMessage');
  expect(apiCall.mock.calls[1][2]).toEqual({ chat_id: 123, message_id: 456 });
  apiCall.mockClear();

  // replace text with media
  await editOrReply(
    api,
    { media: { media: 'abc', type: 'document' } },
    { chatId: 123, hasMedia: false, messageId: 456 }
  );

  expect(apiCall.mock.calls[0][1]).toBe('sendDocument');
  expect(apiCall.mock.calls[1][1]).toBe('deleteMessage');
  expect(apiCall.mock.calls[1][2]).toEqual({ chat_id: 123, message_id: 456 });
});

test('should edit the message in a chat', async () => {
  const { api, apiCall } = getApi();

  // edit a media message
  await editOrReply(
    api,
    { media: { media: 'abc', type: 'document' } },
    { chatId: 123, hasMedia: true, messageId: 456 }
  );

  expect(apiCall.mock.calls[0][1]).toBe('editMessageMedia');
  apiCall.mockClear();

  // edit a text message
  await editOrReply(
    api,
    { text: 'hello' },
    { chatId: 123, hasMedia: false, messageId: 456 }
  );

  expect(apiCall.mock.calls[0][1]).toBe('editMessageText');
});

test('should edit an inline message', async () => {
  const { api, apiCall } = getApi();

  // edit an inline media message
  await editOrReply(
    api,
    { media: { media: 'abc', type: 'document' } },
    { hasMedia: true, inlineMessageId: '123' }
  );

  expect(apiCall.mock.calls[0][1]).toBe('editMessageMedia');
  apiCall.mockClear();

  // edit an inline message text
  await editOrReply(
    api,
    { text: 'hello' },
    { hasMedia: false, inlineMessageId: '123' }
  );

  expect(apiCall.mock.calls[0][1]).toBe('editMessageText');
  apiCall.mockClear();

  // edit an inline media message, despite not having a new media
  await editOrReply(
    api,
    { text: 'hello' },
    { hasMedia: true, inlineMessageId: '123' }
  );

  expect(apiCall.mock.calls[0][1]).toBe('editMessageCaption');
  apiCall.mockClear();

  // fail to edit an inline text message, trying to add a media
  await expect(
    editOrReply(
      api,
      { media: { media: 'abc', type: 'document' } },
      { hasMedia: false, inlineMessageId: '123' }
    )
  ).rejects.toThrow();
});

test('should send a message to the chat', async () => {
  const { api, apiCall } = getApi();

  // text message
  await editOrReply(api, { text: 'hello' }, { chatId: 123 });

  expect(apiCall.mock.calls[0][1]).toBe('sendMessage');
  apiCall.mockClear();

  // media message
  await editOrReply(
    api,
    { media: { media: 'abc', type: 'document' } },
    { chatId: 123 }
  );

  expect(apiCall.mock.calls[0][1]).toBe('sendDocument');
});

test('should generate "other" properly', () => {
  expect(
    makeOther(
      {
        text: 'hello',
        entities: [],
        keyboard: [[]],
        parse_mode: 'HTML',
        disable_notification: true,
      },
      ['caption', 'caption_entities', 'reply_markup', 'parse_mode']
    )
  ).toEqual({
    caption: 'hello',
    caption_entities: [],
    reply_markup: { inline_keyboard: [[]] },
    parse_mode: 'HTML',
  });
});

test('should generate input media properly', () => {
  expect(
    makeInputMedia({
      media: { media: 'abc', type: 'document' },
      has_spoiler: true,
      text: 'hello',
    })
  ).toEqual({
    caption: 'hello',
    media: 'abc',
    type: 'document',
  });

  expect(
    makeInputMedia({
      media: { media: 'abc', type: 'video' },
      has_spoiler: true,
      text: 'hello',
    })
  ).toEqual({
    caption: 'hello',
    media: 'abc',
    type: 'video',
    has_spoiler: true,
  });
});

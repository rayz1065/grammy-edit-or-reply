// @denoify-ignore
import { InaccessibleMessage, Message, Update } from 'grammy/types';
import { getMessageInfo, getMessageMediaInfo } from './message-info';
import { Context } from 'grammy';
import {
  generateCallback,
  generateMessage,
  getApi,
  generateMe,
} from './test-utils/helpers.test';

test('should identify the type of media correctly', () => {
  const messages: Message[] = [
    {
      photo: [
        {
          file_id: '123',
          file_unique_id: '12345',
          height: 1,
          width: 2,
          file_size: 12345,
        },
      ],
    } as Message.PhotoMessage,
    {
      video: {
        duration: 123,
        file_id: '123',
        file_unique_id: '12345',
        height: 1,
        width: 2,
        file_size: 12345,
      },
    } as Message.VideoMessage,
    {
      animation: {
        duration: 123,
        file_id: '123',
        file_unique_id: '12345',
        height: 1,
        width: 2,
        file_size: 12345,
      },
    } as Message.AnimationMessage,
    {
      audio: {
        duration: 123,
        file_id: '123',
        file_unique_id: '12345',
        file_size: 12345,
      },
    } as Message.AudioMessage,
    {
      document: {
        file_id: '123',
        file_unique_id: '12345',
        file_size: 12345,
      },
    } as Message.DocumentMessage,
    { text: 'hello' } as Message.TextMessage,
  ];

  for (const message of messages) {
    const mediaInfo = getMessageMediaInfo(message);
    if (mediaInfo) {
      expect(mediaInfo.media.file_id).toBe('123');
      expect(mediaInfo.media.file_unique_id).toBe('12345');
    }
  }

  expect(getMessageMediaInfo(messages[0])?.type).toBe('photo');
  expect(getMessageMediaInfo(messages[1])?.type).toBe('video');
  expect(getMessageMediaInfo(messages[2])?.type).toBe('animation');
  expect(getMessageMediaInfo(messages[3])?.type).toBe('audio');
  expect(getMessageMediaInfo(messages[4])?.type).toBe('document');
  expect(getMessageMediaInfo(messages[5])).toBeNull();
});

test('should identify the message info', () => {
  const { api } = getApi();
  const me = generateMe();

  const updates: Update[] = [
    {
      update_id: 123,
      message: generateMessage(),
    },
    {
      update_id: 123,
      callback_query: generateCallback(),
    },
    {
      update_id: 123,
      callback_query: {
        ...generateCallback(),
        message: {
          ...generateMessage(),
          document: {
            file_id: '123',
            file_unique_id: '123456',
          },
        },
      },
    },
    {
      update_id: 123,
      callback_query: {
        ...generateCallback(),
        message: {
          ...generateMessage(),
          date: 0,
          text: undefined,
        } satisfies InaccessibleMessage,
      },
    },
    {
      update_id: 123,
      callback_query: {
        ...generateCallback(),
        inline_message_id: 'abc123',
        message: undefined,
      },
    },
  ];

  const contexts = updates.map((x) => new Context(x, api, me));

  // OldMessageInfoChat
  expect(getMessageInfo(contexts[0])).toEqual({
    chatId: 123,
  });

  // OldMessageInfoChatMessage
  expect(getMessageInfo(contexts[1])).toEqual({
    chatId: 123,
    messageId: 456,
    hasMedia: false,
  });

  expect(getMessageInfo(contexts[2])).toEqual({
    chatId: 123,
    messageId: 456,
    hasMedia: true,
  });

  expect(getMessageInfo(contexts[3], true)).toEqual({
    chatId: 123,
    messageId: 456,
    hasMedia: true,
  });

  expect(getMessageInfo(contexts[3], false)).toEqual({
    chatId: 123,
    messageId: 456,
    hasMedia: false,
  });

  // OldMessageInfoInline
  expect(getMessageInfo(contexts[4], true)).toEqual({
    inlineMessageId: 'abc123',
    hasMedia: true,
  });

  expect(getMessageInfo(contexts[4], false)).toEqual({
    inlineMessageId: 'abc123',
    hasMedia: false,
  });
});

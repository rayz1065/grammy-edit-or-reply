// @denoify-ignore
import { Context } from 'grammy';
import {
  generateCallback,
  generateMe,
  generateMessage,
  getApi,
} from './test-utils/helpers.test';
import { editOrReplyMiddleware } from './middleware';
import { EditOrReplyFlavor } from './types';

test('should edit or reply', async () => {
  const { api, apiCall } = getApi();
  const me = generateMe();

  const ctx = new Context(
    {
      update_id: 12345,
      callback_query: {
        ...generateCallback(),
        message: {
          ...generateMessage(),
          video: {
            duration: 1,
            file_id: '123',
            file_unique_id: '123456',
            height: 1,
            width: 1,
          },
        },
      },
    },
    api,
    me
  ) as Context & EditOrReplyFlavor;

  const middleware = editOrReplyMiddleware();
  middleware(ctx, (() => {}) as any);

  // reply
  await ctx.editOrReply({
    text: 'hello',
  });

  expect(apiCall.mock.calls[0][1]).toBe('sendMessage');
  expect(apiCall.mock.calls[1][1]).toBe('deleteMessage');
  apiCall.mockClear();

  // edit
  await ctx.editOrReply({
    text: 'hello',
    media: { media: '123', type: 'animation' },
  });

  expect(apiCall.mock.calls[0][1]).toBe('editMessageMedia');
});

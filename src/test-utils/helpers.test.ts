// @denoify-ignore
import { Api, Transformer } from 'grammy';
import {
  CallbackQuery,
  Chat,
  Message,
  User,
  UserFromGetMe,
} from 'grammy/types';

export function getApi() {
  const api = new Api('12345:ABCDE');

  // mock calls
  const apiCall = jest.fn(
    (async () => ({ ok: true, result: true }) as any) as Transformer
  );
  api.config.use(apiCall);

  return { apiCall, api };
}

export function generateMe(): UserFromGetMe {
  return {
    id: 12345,
    can_join_groups: true,
    can_read_all_group_messages: true,
    supports_inline_queries: true,
    username: 'test',
    first_name: 'Test',
    is_bot: true,
    can_connect_to_business: false,
    has_main_web_app: false,
  };
}

export function generateFrom() {
  return {
    id: 123,
    is_bot: false,
    first_name: 'Test',
    language_code: 'en',
  } satisfies User;
}

export function generateChat() {
  return {
    id: 123,
    first_name: 'Test',
    type: 'private',
  } satisfies Chat;
}

export function generateMessage() {
  return {
    message_id: 456,
    from: generateFrom(),
    chat: generateChat(),
    date: 12345,
  } satisfies Message;
}

export function generateCallback() {
  return {
    id: '123',
    from: generateFrom(),
    message: generateMessage(),
    chat_instance: '123',
    data: 'hello',
  } satisfies CallbackQuery;
}

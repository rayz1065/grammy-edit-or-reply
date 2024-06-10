// @denoify-ignore
import { makeInlineResult } from './inline-results';

test('should create the inline result correctly', () => {
  expect(
    makeInlineResult({
      text: 'test',
      parse_mode: 'HTML',
    })
  ).toEqual({
    input_message_content: {
      message_text: 'test',
      parse_mode: 'HTML',
    },
    type: 'article',
  });

  expect(
    makeInlineResult({
      media: {
        type: 'animation',
        media: 'fileId',
      },
    })
  ).toEqual({
    type: 'gif',
    gif_file_id: 'fileId',
  });

  expect(
    makeInlineResult({
      media: {
        type: 'document',
        media: 'fileId',
      },
    })
  ).toEqual({
    type: 'document',
    document_file_id: 'fileId',
  });

  expect(
    makeInlineResult({
      media: {
        type: 'audio',
        media: 'fileId',
      },
    })
  ).toEqual({
    type: 'document',
    document_file_id: 'fileId',
  });

  expect(
    makeInlineResult({
      media: {
        type: 'animation',
        media: 'fileId',
      },
    })
  ).toEqual({
    type: 'gif',
    gif_file_id: 'fileId',
  });

  expect(
    makeInlineResult({
      media: {
        type: 'video',
        media: 'fileId',
      },
    })
  ).toEqual({
    type: 'video',
    video_file_id: 'fileId',
  });
});

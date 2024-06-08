# Grammy Edit or Reply

✨ Provides a plugin for grammy to easily **edit** a message or **reply** to a message based on the context.

This plugin aims to greatly simplify the way you write code by unifying handlers for **commands**, **callbacks**, and **inline mode**.
It can seamlessly edit to and from:

- 📝 Text messages

- 🖼️ Photos

- 🎞️ Animations

- 📹 Videos

- 📄 Documents

- 🎵 Audio

```typescript
async function replyWithCounter(ctx: MyContext, count: number) {
  return await ctx.editOrReply({
    text: `Hello world!\nCount: ${count}`,
    keyboard: [
      [
        {
          text: '+1',
          callback_data: `count_${count + 1}`,
        },
      ],
    ],
    parse_mode: 'HTML',
    link_preview_options: {
      url: 'https://t.me/checklibot',
      prefer_small_media: true,
      show_above_text: true,
    },
    // reply_parameters will be ignored when irrelevant!
    reply_parameters: ctx.msgId ? { message_id: ctx.msgId } : undefined,
  });
}

bot.command('start', async (ctx) => {
  await replyWithCounter(ctx, 0);
});

bot.callbackQuery(/count_(\d+)/, async (ctx) => {
  await replyWithCounter(ctx, Number(ctx.match[1]));
});
```

> 👇 See [below](#complete-example) for a complete example using different types of media working across commands, callback queries, and inline queries, including the generation of `InlineQueryResult`s.

When editing from a text message to one containing media, the previous message will be deleted and the new one with the media will be sent.
The same behavior also happens when replacing a message containing media with one without media.
If an error occurs, no message is deleted.

You can import the `editOrReply` function to use the same functionality when a `Context` object is unavailable.

## Installation and Setup

```bash
npm install grammy-edit-or-reply
# or
yarn add grammy-edit-or-reply
```

> ⚙️ Instead of using semver, grammy-edit-or-reply uses the same major and minor as the latest supported grammy version.

You can then add the middleware as follows:

```typescript
// extend your context
type MyContext = Context & EditOrReplyFlavor;
const bot = new Bot<MyContext>('12345:ABCDE');

// register the middleware
bot.use(editOrReplyMiddleware());
```

## Unified Message Data Interface

This library offers a simple unified interface for defining messages and inline messages, both for sending and editing, with and without media, see `MessageData` for all the options.

```typescript
function getMenuMessage(ctx: MyContext) {
  return {
    text: 'This is a very complete example of the things that edit-or-reply can do for you!',
    media: {
      type: 'animation',
      media: 'file-id-here',
    },
    has_spoiler: true,
    show_caption_above_media: true,
    // only inline keyboards are supported since other kinds
    // of keyboards can't be passed to message-editing endpoints
    keyboard: [[{ text: 'Hello World', url: 'https://example.com' }]],
    disable_notification: true,
    protect_content: true,
    reply_parameters: ctx.msgId ? { message_id: ctx.msgId } : undefined,
    entities: [
      { offset: 10, length: 4, type: 'bold' },
      {
        offset: 51,
        length: 13,
        type: 'text_link',
        url: 'https://github.com/rayz1065/grammy-edit-or-reply',
      },
    ],
    // explicitly set parse_mode to undefined if you're using the parseMode plugin,
    // otherwise entities will not work!
    parse_mode: undefined,
    // using `satisfies` helps keep the type narrow
  } satisfies MessageData;
}
```

This allows you to describe messages in a method-agnostic way, `editOrReply` will then be tasked to pick the right one out of the **11** available and correctly structure the data to call it.

## Return type

The return type depends on the method used, most of them will return the message, except for inline methods that return `true`.
A simple type check (or assertion if you're sure no inline method will be used) will allow you to access the message's data.

```typescript
bot.command('start', async (ctx) => {
  const result = await ctx.editOrReply(getMenuMessage(ctx));
  // notice how inline-mode methods can return True
  assert(typeof result !== 'boolean');
  console.log(result.message_id);
});
```

## Generating Inline Query Results

This plugin can also help you generate inline query results out of your messages through the `makeInlineResult` function.

Caveats:

- `InputFile`s are not supported in `sendInlineQuery`, the type of media must therefore be narrowed down in case it's too broad using `messageDataHasNoInputFile`.
- Permitting URLs as media would require adding a lot of extra metadata (like thumbnails and mime types), to keep message definition simple **only file ids are allowed**;
- sending an audio by file id can [run into issues with metadata](https://github.com/telegraf/telegraf/issues/884#issuecomment-582278542), even though the file is already stored on Telegram's server. Audios are therefore sent as documents, changing the appearance of the inline result, but not that of the sent message.

```typescript
const messageData = getMenuMessage();
assert(messageDataHasNoInputFile(messageData)); // if necessary
const result = {
  ...makeInlineResult(getMenuMessage()),
  id: `0`,
  title: `Main menu`,
};
```

## How it works

Under the hood `editOrReply` uses a function called `getMessageInfo` to determine the type of the message in the current context, three types are possible:

- `OldMessageInfoChat`, only the chat is available

- `OldMessageInfoChatMessage`, the chat and a message to edit are available

- `OldMessageInfoInline`, an inline message is available

`OldMessageInfoChatMessage` and `OldMessageInfoInline` further specify whether the previous message has a media by using `getMessageMediaInfo` on the message, if the message is not available (inline mode or inaccessible message) a guess will be made.
Call `ctx.getMessageInfo` directly if you want more control over the guess and pass the result to `ctx.editOrReply`.

## Complete Example

```typescript
const myMedias: MessageDataMedia['media'][] = [
  // your medias here
];

const prettyMediaTypes = {
  photo: '🖼️',
  animation: '🎞️',
  video: '📹',
  document: '📄',
  audio: '🎵',
};

function makeMediaGallery(selectedIdx?: number) {
  const media =
    selectedIdx !== undefined ? myMedias.at(selectedIdx) : undefined;

  const keyboard: InlineKeyboardButton[][] = [
    myMedias.map((x, i) => ({
      text: prettyMediaTypes[x.type],
      callback_data: `media_${i}`,
    })),
  ];

  if (media) {
    return {
      text: `Media id: <code>${media.media}</code>`,
      parse_mode: 'HTML',
      media,
      keyboard,
    } satisfies MessageDataMedia;
  }

  return {
    text: 'Pick the media from the options',
    keyboard,
  } satisfies MessageData;
}

// generate inlineQueryResults based on the message data
bot.inlineQuery('gallery', async (ctx) => {
  const results = myMedias.map((x, i) => ({
    ...makeInlineResult(makeMediaGallery(i)),
    id: `media-${i}`,
    title: `Send ${x.type} ${prettyMediaTypes[x.type]}`,
  }));
  await ctx.answerInlineQuery(results);
});

bot.command('gallery', async (ctx) => {
  await ctx.editOrReply(makeMediaGallery());
});

bot.callbackQuery(/media_(\d+)/, async (ctx) => {
  const selectedIdx = Number(ctx.match[1]);
  await ctx.editOrReply(makeMediaGallery(selectedIdx));
});

// use this to get the file IDs
bot.use(async (ctx, next) => {
  if (ctx.message) {
    const res = getMessageMediaInfo(ctx.message);
    if (res) {
      console.log('media info', res);
    }
  }
  await next();
});
```

## License

Grammy Edit or Reply is available under the **MIT License**.

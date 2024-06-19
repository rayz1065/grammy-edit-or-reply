import { Bot, Context } from 'https://deno.land/x/grammy@v1.25.0/mod.ts';
import { InlineKeyboardButton } from 'https://deno.land/x/grammy_types@v3.8.0/markup.ts';
import {
  editOrReplyMiddleware,
  EditOrReplyFlavor,
  MessageDataMedia,
  makeInlineResult,
  MessageData,
  getMessageMediaInfo,
} from '../deno_out/mod.ts';

type MyContext = Context & EditOrReplyFlavor;
const bot = new Bot<MyContext>('YOUR-TOKEN-HERE');
bot.use(editOrReplyMiddleware());

const myMedias: MessageDataMedia['media'][] = [
  // your-media-here (send the media to the bot to receive the file-id)
];

const prettyMediaTypes = {
  photo: '🖼️',
  animation: '🎞️',
  video: '📹',
  document: '📄',
  audio: '🎵',
};

function makeMediaGallery(selectedIdx?: number) {
  const keyboard: InlineKeyboardButton[][] = [
    myMedias.map((x, i) => ({
      text: prettyMediaTypes[x.type],
      callback_data: `media_${i}`,
    })),
  ];

  const media =
    selectedIdx !== undefined ? myMedias.at(selectedIdx) : undefined;
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
bot.inlineQuery(/.*/, async (ctx) => {
  const results = myMedias.map((x, i) => ({
    ...makeInlineResult(makeMediaGallery(i)),
    id: `media-${i}`,
    title: `Send ${x.type} ${prettyMediaTypes[x.type]}`,
  }));
  await ctx.answerInlineQuery(results);
});

bot.command('start', async (ctx) => {
  await ctx.editOrReply(makeMediaGallery());
});

bot.callbackQuery(/media_(\d+)/, async (ctx) => {
  const selectedIdx = Number(ctx.match[1]);
  try {
    await ctx.editOrReply(makeMediaGallery(selectedIdx));
  } catch (error) {
    // the above can throw message is not modified
    console.error(error);
  }
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

async function main() {
  await bot.start({
    onStart: () => {
      console.log('Bot running...');
    },
  });
}

void main();

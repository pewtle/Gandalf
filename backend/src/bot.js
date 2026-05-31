'use strict';

const TelegramBot = require('node-telegram-bot-api');
const { parseTask } = require('./parseTask');

function startBot(db) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetName = process.env.TARGET_NAME || 'Oli';

  const allowedIds = process.env.ALLOWED_CHAT_IDS
    ? process.env.ALLOWED_CHAT_IDS.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean)
    : [];

  const bot = new TelegramBot(token, { polling: true });

  const insertTask = db.prepare('INSERT INTO tasks (title, source) VALUES (?, ?)');

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (allowedIds.length > 0 && !allowedIds.includes(chatId)) {
      bot.sendMessage(chatId, "Sorry, you're not authorised to add tasks to Gandalf.");
      return;
    }

    // Ignore bot commands
    if (text.startsWith('/')) return;

    const task = parseTask(text, targetName);

    if (!task) {
      bot.sendMessage(
        chatId,
        `Couldn't parse a task from that. Try: "${targetName} can you call the dentist"`
      );
      return;
    }

    insertTask.run(task, 'telegram');
    bot.sendMessage(chatId, `Added to Gandalf: "${task}" ✓`);
  });

  bot.on('polling_error', (err) => {
    console.error('Telegram polling error:', err.message);
  });

  console.log(`Telegram bot started (watching for messages to ${targetName})`);
}

module.exports = { startBot };

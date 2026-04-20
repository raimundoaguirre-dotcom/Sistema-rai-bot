const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log('✅ Bot iniciado');

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text || 'Sin texto';

  try {
    console.log(`📩 Mensaje: ${userText}`);
    
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userText }],
    });

    const reply = response.content[0].text;
    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Error procesando tu mensaje');
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '📄 Archivo recibido. Próximamente: procesamiento automático');
  console.log('📎 Archivo recibido:', msg.document.file_name);
});

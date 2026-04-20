const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_TOKEN;
const dropboxToken = process.env.DROPBOX_TOKEN;
const dropboxFolder = process.env.DROPBOX_FOLDER;

const bot = new TelegramBot(token, { polling: true });
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log('✅ Bot iniciado');

// Mensajes de texto
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text || 'Sin texto';

  if (userText.startsWith('/')) return; // Ignorar comandos

  try {
    console.log(`📩 Mensaje: ${userText}`);
    
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
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

// Recibir archivos (fotos, PDFs, etc)
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.document.file_id;
  const fileName = msg.document.file_name;

  try {
    console.log(`📎 Archivo recibido: ${fileName}`);
    
    // Descargar archivo desde Telegram
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.buffer();

    // Subir a Dropbox
    const dropboxPath = `${dropboxFolder}/${new Date().getTime()}_${fileName}`;
    
    await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'add',
          autorename: true,
        }),
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    bot.sendMessage(chatId, `✅ Comprobante guardado: ${fileName}`);
    console.log(`✅ Archivo subido a Dropbox: ${dropboxPath}`);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Error procesando archivo');
  }
});

// Recibir fotos
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  try {
    console.log(`📸 Foto recibida`);
    
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.buffer();

    const timestamp = new Date().getTime();
    const dropboxPath = `${dropboxFolder}/${timestamp}_comprobante.jpg`;
    
    await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'add',
          autorename: true,
        }),
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });

    bot.sendMessage(chatId, `✅ Foto guardada en comprobantes`);
    console.log(`✅ Foto subida a Dropbox: ${dropboxPath}`);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, '❌ Error procesando foto');
  }
});

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
        // executablePath ලයින් එක මම අයින් කළා, ඒකයි ප්‍රශ්නය වුණේ.
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR එක ස්කෑන් කරන්න:');
});

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.on('message', async (msg) => {
    if (msg.body.startsWith('!song')) {
        const songName = msg.body.replace('!song', '').trim();
        if (!songName) return msg.reply('සින්දුවේ නම දෙන්න.');
        try {
            const search = await yts(songName);
            const video = search.videos[0];
            if (video) {
                msg.reply(`සොයාගත්තා: ${video.title}\nLink: ${video.url}`);
            }
        } catch (e) {
            msg.reply('Error එකක් ආවා.');
        }
    }
});

client.initialize();

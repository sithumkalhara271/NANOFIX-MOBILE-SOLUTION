const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

// Render එකේ Port Error එක නැති කිරීමට
app.get('/', (req, res) => res.send('Bot is Alive!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('QR LINK:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
});

client.on('ready', () => {
    console.log('බොට් වැඩ!');
});

client.on('message', async (msg) => {
    if (msg.body.startsWith('!song')) {
        const songName = msg.body.replace('!song', '').trim();
        if (!songName) return msg.reply('සින්දුවක නම දෙන්න.');

        try {
            const search = await yts(songName);
            const video = search.videos[0];
            if (video) {
                msg.reply(`*සොයාගත්තා:* ${video.title}\n*Link:* ${video.url}`);
            } else {
                msg.reply('සින්දුව හම්බුනේ නෑ.');
            }
        } catch (e) {
            msg.reply('Error එකක් ආවා.');
        }
    }
});

client.initialize();

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
            '--single-process',
            '--no-zygote'
        ],
        // Render එකේදී chrome install වන සාමාන්‍ය ස්ථානය
        executablePath: '/usr/bin/google-chrome-stable' 
    }
});

// QR Code එක පෙන්වීමට
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('කරුණාකර මෙම QR කේතය ස්කෑන් කරන්න!');
});

client.on('ready', () => {
    console.log('බොට් සාර්ථකව වැඩ ආරම්භ කළා!');
});

client.on('message', async (msg) => {
    if (msg.body.startsWith('!song')) {
        const songName = msg.body.replace('!song', '').trim();
        if (!songName) return msg.reply('කරුණාකර සින්දුවේ නම ඇතුළත් කරන්න. උදා: !song Manike Mage Hithe');

        try {
            msg.reply('සින්දුව සොයමින් පවතී... කරුණාකර රැඳී සිටින්න.');
            
            const search = await yts(songName);
            const video = search.videos[0];

            if (!video) return msg.reply('සින්දුව සොයා ගැනීමට නොහැකි විය.');

            const songUrl = video.url;
            
            await msg.reply(`*සොයාගත් සින්දුව:* ${video.title}\n*කාලය:* ${video.timestamp}\n\nමෙන්න ලින්ක් එක: ${songUrl}`);

        } catch (e) {
            console.error(e);
            msg.reply('Error එකක් ආවා. පසුව උත්සාහ කරන්න.');
        }
    }
});

client.initialize();

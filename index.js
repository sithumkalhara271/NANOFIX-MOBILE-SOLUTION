const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 10000;
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
    console.log('QR LINK: https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(qr));
});

client.on('ready', () => {
    console.log('බොට් සාර්ථකව වැඩ ආරම්භ කළා!');
});

// 'message_create' පාවිච්චි කිරීමෙන් ඔයා ඔයාටම යවන මැසේජ් වලටත් රිප්ලයි ලැබෙනවා
client.on('message_create', async (msg) => {
    const text = msg.body.toLowerCase();

    if (text.startsWith('!song')) {
        const songName = msg.body.replace('!song', '').trim();
        if (!songName) return msg.reply('සින්දුවක නම දෙන්න.');

        try {
            const search = await yts(songName);
            const video = search.videos[0];
            if (!video) return msg.reply('සින්දුව හමු වුණේ නැත.');

            // තොරතුරු යැවීම
            await client.sendMessage(msg.from, `🎶 *සොයාගත්තා:* ${video.title}\n⏳ *කාලය:* ${video.timestamp}\n\n*MP3 එක සකසමින් පවතී...*`);

            // MP3 Download API
            const apiUrl = `https://api.dreaded.site/api/ytdl/video?url=${video.url}`;
            const res = await axios.get(apiUrl);
            
            if (res.data && res.data.result && res.data.result.downloadLink) {
                const media = await MessageMedia.fromUrl(res.data.result.downloadLink);
                // සින්දුව මැසේජ් එක ආපු තැනටම (ඔයාටම) යැවීම
                await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
            } else {
                await client.sendMessage(msg.from, 'MP3 එක ලබා ගැනීමට නොහැකි විය. ලින්ක් එක: ' + video.url);
            }

        } catch (e) {
            console.error(e);
            await client.sendMessage(msg.from, 'Error: යම් දෝෂයක් සිදු විය.');
        }
    }
});

client.initialize();

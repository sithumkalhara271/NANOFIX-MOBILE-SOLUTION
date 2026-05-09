const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const express = require('express');
const axios = require('axios');

// Express Server Setup
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Nanofix Bot is Running!'));
app.listen(port, () => console.log(`Server on port ${port}`));

const client = new Client({
    // මෙතන LocalAuth පාවිච්චි කරන්නේ Railway වල session එකක් තියාගන්නයි
    authStrategy: new RemoteAuth({
        // මෙතන session එක සේව් කරන විදිහ (RemoteAuth සඳහා mongoDB වැනි එකක් අවශ්‍ය වේ)
        // දැනට ලේසි වෙන්න LocalAuth ම මම පාවිච්චි කරනවා, 
        // නමුත් Railway වල Persistent Volume එකක් නැති නිසා redeploy එකකදී QR එක ඕන වෙනවාමයි.
    }),
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

const PREFIX = '.'; // ! වෙනුවට . යොදා ඇත

client.on('qr', (qr) => {
    console.log('QR LINK: https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(qr));
});

client.on('ready', () => {
    console.log('Nanofix Bot is Ready!');
});

client.on('message_create', async (msg) => {
    const text = msg.body.toLowerCase();

    // .song කමාන්ඩ් එක
    if (text.startsWith(`${PREFIX}song`)) {
        const songName = msg.body.replace(`${PREFIX}song`, '').trim();
        if (!songName) return msg.reply('කරුණාකර සින්දුවක නම ලබා දෙන්න. උදා: .song Manike');

        try {
            const search = await yts(songName);
            const video = search.videos[0];
            if (!video) return msg.reply('සින්දුව හමුවුනේ නැත.');

            await client.sendMessage(msg.from, `🎶 *Nanofix Music Downloader*\n\n📌 *නම:* ${video.title}\n⏳ *කාලය:* ${video.timestamp}\n\n*MP3 එක සකසමින් පවතී...*`);

            const apiUrl = `https://api.giftedtech.my.id/api/download/dlmp3?url=${encodeURIComponent(video.url)}`;
            const res = await axios.get(apiUrl);
            
            if (res.data && res.data.success) {
                const media = await MessageMedia.fromUrl(res.data.result.download_url);
                await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
            } else {
                await client.sendMessage(msg.from, 'Error: MP3 ලබා ගැනීමට නොහැකි විය.');
            }
        } catch (e) {
            await client.sendMessage(msg.from, 'Error: යම් දෝෂයක් සිදු විය.');
        }
    }

    // .alive කමාන්ඩ් එක (බොට් වැඩද බලන්න)
    if (text === `${PREFIX}alive`) {
        msg.reply('Nanofix Bot වැඩ කරනවා! ✅');
    }

    // .restart කමාන්ඩ් එක (බොට්ව නැවත පණගැන්වීමට)
    if (text === `${PREFIX}restart`) {
        await msg.reply('බොට් නැවත පණගැන්වෙමින් පවතී... (Redeploy කිරීම නිර්දේශ කෙරේ)');
        process.exit(); // මෙය සිදුවූ විට Railway බොට්ව ඔටෝම restart කරයි
    }
});

client.initialize();

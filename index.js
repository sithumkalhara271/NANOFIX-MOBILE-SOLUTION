const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');

// 1. ඔබේ MongoDB Connection String එක මෙතනට දාන්න
const MONGO_URI = "mongodb+srv://sithumkalhara271:Sithum97531@@cluster0.c3nyat4.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI).then(() => {
    const store = new MongoStore({ mongoose: mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 60000, // සෑම විනාඩියකටම බැකප් වේ
            proxyAuthentication: { username: "username", password: "password" },
        }),
        puppeteer: {
            handleSIGINT: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
            executablePath: process.env.CHROME_BIN || null,
        }
    });

    // QR Code එක පෙන්වීම
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        console.log('කරුණාකර මෙම QR කේතය ස්කෑන් කරන්න!');
    });

    // සෙෂන් එක සේව් වූ පසු
    client.on('remote_session_saved', () => {
        console.log('Session එක සාර්ථකව දුරස්ථව ගබඩා වුණා!');
    });

    client.on('ready', () => {
        console.log('බොට් සාර්ථකව වැඩ ආරම්භ කළා!');
    });

    // !song command එක
    client.on('message', async (msg) => {
        if (msg.body.startsWith('!song')) {
            const songName = msg.body.replace('!song', '').trim();
            if (!songName) return msg.reply('කරුණාකර සින්දුවේ නම ඇතුළත් කරන්න. උදා: !song Manike Mage Hithe');

            try {
                const search = await yts(songName);
                const video = search.videos[0];

                if (!video) return msg.reply('සින්දුව සොයා ගැනීමට නොහැකි විය.');

                await msg.reply(`🎶 *සොයාගත් සින්දුව:* ${video.title}\n⏳ *කාලය:* ${video.timestamp}\n\nMP3 එක සකසමින් පවතී...`);

                const filePath = `./${video.videoId}.mp3`;
                const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });

                // සින්දුව ඩවුන්ලෝඩ් කර සේව් කිරීම
                stream.pipe(fs.createWriteStream(filePath)).on('finish', async () => {
                    const media = MessageMedia.fromFilePath(filePath);
                    
                    // Audio එක document එකක් ලෙස යැවීම (ගුණාත්මකභාවය සුරැකීමට)
                    await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
                    
                    // යැවූ පසු file එක ඉවත් කිරීම
                    fs.unlinkSync(filePath);
                }).on('error', (err) => {
                    console.error(err);
                    msg.reply('සින්දුව ඩවුන්ලෝඩ් කිරීමේදී දෝෂයක් ඇති විය.');
                });

            } catch (e) {
                console.log(e);
                msg.reply('Error එකක් ආවා. පසුව උත්සාහ කරන්න.');
            }
        }
    });

    client.initialize();
});

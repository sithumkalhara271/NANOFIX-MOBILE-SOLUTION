const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');

// 1. ඔබේ MongoDB Connection String එක
const MONGO_URI = "mongodb+srv://sithumkalhara271:Sithum97531%40@cluster0.c3nyat4.mongodb.net/?appName=Cluster0";

// 2. මෙතනට ඔබේ බොට් නම්බර් එක දාන්න (උදා: '94771234567')
const BOT_NUMBER = '94781229710'; 

mongoose.connect(MONGO_URI).then(() => {
    const store = new MongoStore({ mongoose: mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 60000,
            clientId: "bot-session"
        }),
        puppeteer: {
            handleSIGINT: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
            executablePath: process.env.CHROME_BIN || null,
        }
    });

    // QR Code එක (අවශ්‍ය වුවහොත් ලොග් එකේ පෙන්වයි)
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        console.log('QR Code එක ස්කෑන් කරන්න අපහසු නම් පහළ Pairing Code එක එනකම් ඉන්න.');
    });

    // Pairing Code ලබා ගැනීම
    client.on('ready', () => {
        console.log('බොට් සාර්ථකව වැඩ ආරම්භ කළා!');
    });

    client.on('remote_session_saved', () => {
        console.log('Session එක සාර්ථකව Database එකේ සේව් වුණා!');
    });

    client.initialize();

    // Pairing Code එක Generate කිරීම
    setTimeout(async () => {
        try {
            // මෙතන BOT_NUMBER එක පාවිච්චි වේ
            let code = await client.getPairingCode(BOT_NUMBER); 
            console.log('\n---------------------------------');
            console.log('ඔයාගේ WhatsApp Pairing Code එක: ', code);
            console.log('---------------------------------\n');
        } catch (err) {
            console.log('Pairing Code ලබා ගැනීමේ දෝෂයක් (සමහරවිට දැනටමත් ලොග් වී ඇත): ', err.message);
        }
    }, 10000); // තත්පර 10 කින් කෝඩ් එක පෙන්වයි

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

                stream.pipe(fs.createWriteStream(filePath)).on('finish', async () => {
                    const media = MessageMedia.fromFilePath(filePath);
                    await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
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
});

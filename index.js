const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');

// MongoDB Connection URI
const MONGO_URI = "mongodb+srv://sithumkalhara271:Sithum97531%40@cluster0.c3nyat4.mongodb.net/?appName=Cluster0";
const BOT_NUMBER = '94781229710'; 

mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ MongoDB හා සාර්ථකව සම්බන්ධ විය!');
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
                '--single-process'
            ],
            // Dockerfile එකේ අපි ලබාදුන් path එක මෙහි භාවිතා වේ
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        }
    });

    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        console.log('QR Code එක ස්කෑන් කරන්න හෝ Pairing Code එක එනතෙක් රැඳී සිටින්න...');
    });

    client.on('ready', () => {
        console.log('✅ NANOFIX Bot සාර්ථකව සක්‍රිය විය!');
    });

    // Pairing Code එක Deploy Logs වල බලාගැනීමට
    client.on('code', (code) => {
        console.log('\n---------------------------------');
        console.log('ඔබේ WhatsApp Pairing Code එක: ', code);
        console.log('---------------------------------\n');
    });

    client.initialize();

    // Pairing Code ඉල්ලුම් කිරීම (තත්පර 15 කට පසු)
    setTimeout(async () => {
        try {
            if (client.getPairingCode) {
                await client.getPairingCode(BOT_NUMBER);
            }
        } catch (err) {
            console.log('Pairing Error: ', err.message);
        }
    }, 15000);

    // !song command එක ක්‍රියාත්මක කිරීම
    client.on('message', async (msg) => {
        if (msg.body.startsWith('!song')) {
            const songName = msg.body.replace('!song', '').trim();
            if (!songName) return msg.reply('❌ සින්දුවේ නම ඇතුළත් කරන්න.');

            try {
                const search = await yts(songName);
                const video = search.videos[0];
                if (!video) return msg.reply('❌ සින්දුව හමු වුණේ නැහැ.');

                await msg.reply(`🎶 *${video.title}* බාගත වෙමින් පවතී...`);

                const filePath = `./${video.videoId}.mp3`;
                const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });

                stream.pipe(fs.createWriteStream(filePath)).on('finish', async () => {
                    const media = MessageMedia.fromFilePath(filePath);
                    await client.sendMessage(msg.from, media, { sendAudioAsVoice: false });
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                });
            } catch (e) {
                console.error(e);
                msg.reply('⚠️ සින්දුව ලබා ගැනීමේ දෝෂයක්. (YouTube සීමාවන් නිසා විය හැක)');
            }
        }
    });
}).catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
});

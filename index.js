const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const express = require('express'); // Express ඇතුළත් කළා

const app = express();
const port = process.env.PORT || 3000;
let lastQR = ""; // අලුත්ම QR එක තබා ගැනීමට

// Express සර්වර් එක ආරම්භ කිරීම
app.get('/', (req, res) => {
    if (lastQR) {
        // QR එක වෙබ් පිටුවක පෙන්වීම
        res.send(`
            <html>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                    <h2>NANOFIX Bot QR Code</h2>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(lastQR)}&size=300x300" alt="QR Code" />
                    <p>කරුණාකර මෙය WhatsApp මගින් ස්කෑන් කරන්න.</p>
                    <script>setTimeout(() => { location.reload(); }, 30000);</script>
                </body>
            </html>
        `);
    } else {
        res.send("<h2>QR Code එක තවම සූදානම් නැත. කරුණාකර තත්පර කිහිපයකින් Refresh කරන්න...</h2>");
    }
});

app.listen(port, () => {
    console.log(`✅ Web Server එක port ${port} හි වැඩ කරයි.`);
});

// MongoDB Connection
const MONGO_URI = "mongodb+srv://sithumkalhara271:Sithum97531%40@cluster0.c3nyat4.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ MongoDB හා සම්බන්ධ විය!');
    const store = new MongoStore({ mongoose: mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 60000,
            clientId: "bot-session"
        }),
        puppeteer: {
            handleSIGINT: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
            executablePath: '/usr/bin/google-chrome-stable'
        }
    });

    client.on('qr', (qr) => {
        lastQR = qr; // QR එක Variable එකට දාගන්නවා
        qrcode.generate(qr, { small: true });
        console.log('👉 QR එක වෙබ් ලින්ක් එකෙන් බලන්න පුළුවන්.');
    });

    client.on('ready', () => {
        lastQR = ""; // Ready වූ පසු QR එක අයින් කරනවා
        console.log('✅ NANOFIX Bot සාර්ථකව සක්‍රිය විය!');
    });

    client.initialize();

    // !song command logic
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
                msg.reply('⚠️ සින්දුව ලබා ගැනීමේ දෝෂයක්.');
            }
        }
    });
});

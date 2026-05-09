const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode'); // 'qrcode-terminal' වෙනුවට 'qrcode' පාවිච්චි කරමු
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
let lastQR = ""; 

// Express සර්වර් එක - පැහැදිලි QR එකක් පෙන්වීමට
app.get('/', async (req, res) => {
    if (lastQR) {
        try {
            // QR කේතය Image Data URL එකක් බවට පත් කිරීම
            const qrImage = await qrcode.toDataURL(lastQR, {
                margin: 2,
                scale: 10
            });
            
            res.send(`
                <html>
                    <head>
                        <title>NANOFIX Bot QR</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background-color:#f4f7f6;margin:0;">
                        <div style="background:white;padding:30px;border-radius:20px;box-shadow: 0 10px 25px rgba(0,0,0,0.1);text-align:center;max-width:90%;">
                            <h2 style="color:#075e54;margin-bottom:20px;">NANOFIX Bot QR Code</h2>
                            <img src="${qrImage}" style="width:100%;max-width:300px;border:1px solid #eee;" alt="QR Code" />
                            <p style="margin-top:20px;color:#333;font-weight:bold;">කරුණාකර මෙය WhatsApp Link Devices හරහා ස්කෑන් කරන්න.</p>
                            <p style="font-size:13px;color:#777;">සෑම තත්පර 30කටම වරක් මෙම පිටුව අලුත් වේ.</p>
                        </div>
                        <script>setTimeout(() => { location.reload(); }, 30000);</script>
                    </body>
                </html>
            `);
        } catch (err) {
            res.send("QR එක උත්පාදනය කිරීමේදී දෝෂයක් ඇති විය.");
        }
    } else {
        res.send(`
            <div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
                <div style="text-align:center;">
                    <h2>QR Code එක තවම සූදානම් නැත...</h2>
                    <p>සර්වර් එක ආරම්භ වෙමින් පවතී. කරුණාකර තත්පර කිහිපයකින් Refresh කරන්න.</p>
                </div>
            </div>
        `);
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
            executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable'
        }
    });

    client.on('qr', (qr) => {
        lastQR = qr; 
        console.log('👉 අලුත් QR එකක් ලැබුණා. වෙබ් ලින්ක් එකෙන් බලන්න.');
    });

    client.on('ready', () => {
        lastQR = ""; 
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

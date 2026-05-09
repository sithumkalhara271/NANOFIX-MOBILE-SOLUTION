const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core'); // වඩාත් ස්ථාවර සංස්කරණය
const fs = require('fs');

// 1. ඔබේ MongoDB Connection String එක (මෙහි Password එක ආරක්‍ෂිතව තබාගන්න)
const MONGO_URI = "mongodb+srv://sithumkalhara271:Sithum97531%40@cluster0.c3nyat4.mongodb.net/?appName=Cluster0";

// 2. ඔබේ බොට් නම්බර් එක (Country code එක සමඟ - 94XXXXXXXXX)
const BOT_NUMBER = '94781229710'; 

mongoose.connect(MONGO_URI).then(() => {
    const store = new MongoStore({ mongoose: mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 60000,
            clientId: "bot-session"
        }),
        // Pairing Code භාවිතා කරන විට මෙය 'phone-number' ලෙස තිබීම සුදුසුයි
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

    // QR Code එක පෙන්වීම
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        console.log('QR Code එක ස්කෑන් කරන්න. නැතිනම් Pairing Code එක එනතෙක් රැඳී සිටින්න...');
    });

    client.on('ready', () => {
        console.log('✅ බොට් සාර්ථකව සක්‍රිය විය!');
    });

    client.on('remote_session_saved', () => {
        console.log('✅ Session එක Database එකේ සුරැකුණා!');
    });

    // Pairing Code එක ලබා ගැනීම
    client.on('code', (code) => {
        console.log('\n---------------------------------');
        console.log('ඔබේ WhatsApp Pairing Code එක: ', code);
        console.log('---------------------------------\n');
    });

    client.initialize();

    // Pairing Code එක Request කිරීම (සමහර වෙලාවට මෙය මුලින්ම අවශ්‍ය වේ)
    setTimeout(async () => {
        try {
            if (!client.pupPage) return; // තවමත් Page එක load වී නැත්නම්
            let code = await client.getPairingCode(BOT_NUMBER);
        } catch (err) {
            console.log('Pairing Code Error: ', err.message);
        }
    }, 10000);

    // !song command එක
    client.on('message', async (msg) => {
        if (msg.body.startsWith('!song')) {
            const songName = msg.body.replace('!song', '').trim();
            if (!songName) return msg.reply('❌ කරුණාකර සින්දුවේ නම හෝ Link එකක් ඇතුළත් කරන්න.');

            try {
                const search = await yts(songName);
                const video = search.videos[0];
                if (!video) return msg.reply('❌ සින්දුව සොයා ගැනීමට නොහැකි විය.');

                await msg.reply(`🎶 *${video.title}*\n\n⌛ සින්දුව සකසමින් පවතී, කරුණාකර රැඳී සිටින්න...`);

                const filePath = `./${video.videoId}.mp3`;
                
                // Audio Download කිරීම
                const stream = ytdl(video.url, { 
                    filter: 'audioonly', 
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25 
                });

                const fileStream = fs.createWriteStream(filePath);
                stream.pipe(fileStream);

                fileStream.on('finish', async () => {
                    try {
                        const media = MessageMedia.fromFilePath(filePath);
                        await client.sendMessage(msg.from, media, { 
                            sendAudioAsVoice: false 
                        });
                        
                        // ෆයිල් එක යැවූ පසු ඉවත් කිරීම
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (sendErr) {
                        console.error(sendErr);
                        msg.reply('❌ ගොනුව එවීම අසාර්ථක විය. (සමහරවිට මෙගාබයිට් ප්‍රමාණය වැඩි විය හැක)');
                    }
                });

                stream.on('error', (err) => {
                    console.error(err);
                    msg.reply('❌ සින්දුව ලබා ගැනීමේදී දෝෂයක් ඇති විය.');
                });

            } catch (e) {
                console.log(e);
                msg.reply('⚠️ පද්ධතියේ දෝෂයක් ඇති විය. පසුව උත්සාහ කරන්න.');
            }
        }
    });
});

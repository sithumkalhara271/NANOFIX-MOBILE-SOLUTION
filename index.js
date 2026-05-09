const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(), // මීට පෙර RemoteAuth ගැටළු ආ නිසා මෙහි LocalAuth හෝ ඔබේ පැරණි ක්‍රමය භාවිතා කරන්න
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// 1. Prefix එක "." ලෙස සැකසීම
const prefix = '.';

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('QR එක ලැබුණා. වෙබ් ලින්ක් එකෙන් බලන්න.');
});

client.on('ready', () => {
    console.log('NaNofix Bot සාර්ථකව සක්‍රීය විය!');
});

client.on('message', async msg => {
    if (!msg.body.startsWith(prefix)) return;

    const args = msg.body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 2. Song Command එක
    if (command === 'song') {
        const query = args.join(' ');
        if (!query) return msg.reply('කරුණාකර ගීතයේ නම ලබා දෙන්න. (උදා: .song sanda kan tharu)');

        try {
            msg.reply('සොයමින් පවතිනවා... කරුණාකර රැඳී සිටින්න.');

            const search = await yts(query);
            const video = search.videos[0];

            if (!video) return msg.reply('ගීතය සොයාගත නොහැකි විය.');

            const songTitle = video.title;
            const stream = ytdl(video.url, {
                quality: 'highestaudio',
                filter: 'audioonly',
            });

            const filePath = `./${video.videoId}.mp3`;
            const writer = fs.createWriteStream(filePath);

            stream.pipe(writer);

            writer.on('finish', async () => {
                const media = MessageMedia.fromFilePath(filePath);
                
                // 3. mp3 එකක් ලෙස යැවීම
                await client.sendMessage(msg.from, media, {
                    sendMediaAsDocument: true, 
                    filename: `${songTitle}.mp3`,
                    caption: `🎵 *${songTitle}* \n\nNanofix Mobile Solution`
                });

                // ගොනුව යැවූ පසු storage එක පිරීම වැළැක්වීමට එය මකා දැමීම
                fs.unlinkSync(filePath);
            });

            writer.on('error', (err) => {
                console.error(err);
                msg.reply('බාගත කිරීමේදී දෝෂයක් ඇති විය.');
            });

        } catch (e) {
            console.error(e);
            msg.reply('මෙම ගීතය ලබා ගැනීමට නොහැකි විය. පසුව උත්සාහ කරන්න.');
        }
    }
});

client.initialize();

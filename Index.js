const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
            
            // සින්දුව සර්ච් කිරීම
            const search = await yts(songName);
            const video = search.videos[0];

            if (!video) return msg.reply('සින්දුව සොයා ගැනීමට නොහැකි විය.');

            // මෙතනදී අපි සින්දුව MP3 එකක් විදිහට ගන්න API එකක් පාවිච්චි කරනවා
            // සටහන: මෙහිදී සින්දුව ඩවුන්ලෝඩ් කරන URL එක ලබාගත යුතුය
            const songUrl = video.url;
            
            // සරලව තොරතුරු යැවීම
            await msg.reply(`*සොයාගත් සින්දුව:* ${video.title}\n*කාලය:* ${video.timestamp}\n\nMP3 එක සකසමින් පවතී...`);

            // සින්දුව MP3 එකක් ලෙස යැවීමට මෙතැනට තවත් කෝඩ් කොටසක් අවශ්‍ය වේ
            // දැනට අපි link එක එවමු. සම්පූර්ණ file එක යැවීමට API එකක් අවශ්‍යයි.
            msg.reply(`මෙන්න ලින්ක් එක: ${songUrl}`);

        } catch (e) {
            console.log(e);
            msg.reply('Error එකක් ආවා. පසුව උත්සාහ කරන්න.');
        }
    }
});

client.initialize();

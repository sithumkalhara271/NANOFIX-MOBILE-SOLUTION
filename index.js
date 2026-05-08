const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // RAM එක ඉතිරි කර ගැනීමට මෙම args ඉතා වැදගත් වේ
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote',
            '--disable-gpu',
            '--disable-canvas-aa',
            '--disable-2d-canvas-clip-utils',
            '--disable-gl-drawing-for-tests',
            '--no-first-run',
            '--mute-audio'
        ]
    }
});

// QR එක පෙන්වීමට
client.on('qr', (qr) => {
    // Terminal එකේ පෙන්වීම
    qrcode.generate(qr, { small: true });
    
    // ෆෝන් එකෙන් බලන්න ලින්ක් එක
    console.log('--------------------------------------------------');
    console.log('QR ලින්ක් එක:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=300x300`);
    console.log('--------------------------------------------------');
});

client.on('ready', () => {
    console.log('බොට් සාර්ථකව වැඩ ආරම්භ කළා!');
});

// මැසේජ් හැසිරවීම
client.on('message', async (msg) => {
    const text = msg.body.toLowerCase();

    // සරල හෙලෝ මැසේජ් එකක්
    if (text === 'hi' || text === 'hello') {
        return msg.reply('හෙලෝ! මම Nanofix Music Bot. සින්දුවක් සොයා ගැනීමට !song [නම] ලෙස ටයිප් කරන්න.');
    }

    // සින්දු සෙවීමේ කමාන්ඩ් එක
    if (text.startsWith('!song')) {
        const songName = msg.body.replace('!song', '').trim();
        if (!songName) return msg.reply('කරුණාකර සින්දුවේ නම ඇතුළත් කරන්න.');

        try {
            msg.reply('සින්දුව සොයමින් පවතී... (Memory optimized mode)');
            
            const search = await yts(songName);
            const video = search.videos[0];

            if (!video) return msg.reply('සින්දුව සොයා ගැනීමට නොහැකි විය.');

            const response = `*සොයාගත් සින්දුව:* ${video.title}\n*කාලය:* ${video.timestamp}\n*Link:* ${video.url}\n\n_මෙම බොට් දැනට Beta මට්ටමේ පවතී._`;
            
            await msg.reply(response);

        } catch (e) {
            console.error('Error:', e.message);
            msg.reply('පද්ධතියේ දෝෂයක් පවතී. පසුව උත්සාහ කරන්න.');
        }
    }
});

client.initialize();

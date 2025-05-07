const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');
const cors = require('cors');

const bot = new Telegraf('7936250034:AAGXGD6objH1Rdr4WC81YAdlXmJFs0W_cb0');
const app = express();

const adminId = '7810011711';
const tiktokRegex = /(?:https?:\/\/(?:www\.)?tiktok\.com\/[\w\-]+\/[\w\-]+|https?:\/\/vt\.tiktok\.com\/[\w\-]+)/;
let logs = [];

async function resolveShortenedUrl(url) {
    try {
        const response = await axios.get(url, { maxRedirects: 5 });
        return response.request.res.responseUrl;
    } catch (err) {
        return null;
    }
}

async function getTikTokVideo(url) {
    try {
        const { data } = await axios.post(
            "https://tikwm.com/api/",
            `url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        if (data.code !== 0 || !data.data) {
            return null;
        }

        const { title, hdplay, images } = data.data;
        return { title, hdplay, images };
    } catch (err) {
        return null;
    }
}

bot.start((ctx) => {
    ctx.reply('𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗧𝗢 𝗧𝗢𝗦𝗛𝗜 𝗧𝗜𝗞𝗧𝗢𝗞 𝗩𝗜𝗗𝗘𝗢 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 𝗕𝗢𝗧 ! 🎉\n\n\n𝗝𝘂𝘀𝘁 𝘀𝗲𝗻𝗱 𝘁𝗵𝗲 𝗹𝗶𝗻𝗸 𝗼𝗳 𝘁𝗵𝗲 𝘃𝗶𝗱𝗲𝗼 𝘆𝗼𝘂 𝘄𝗮𝗻𝘁 𝘁𝗼 𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱, 𝗮𝗻𝗱 𝘆𝗼𝘂𝗿 𝘃𝗶𝗱𝗲𝗼 𝘄𝗶𝗹𝗹 𝗯𝗲 𝗮𝘂𝘁𝗼𝗺𝗮𝘁𝗶𝗰𝗮𝗹𝗹𝘆 𝘀𝗮𝘃𝗲𝗱 𝘁𝗼 𝘆𝗼𝘂𝗿 𝗱𝗲𝘃𝗶𝗰𝗲. 📲✨\n\n𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 𝗧𝗢𝗦𝗛𝗜 𝗕𝗡𝗦 @Nighative');
});

bot.on('text', async (ctx) => {
    const message = ctx.message.text;

    if (!tiktokRegex.test(message)) {
        return;
    }

    let url = message.trim();
    const mode = url.split("|")[1]?.toLowerCase();

    if (url.includes('vt.tiktok.com')) {
        url = await resolveShortenedUrl(url);
        if (!url) {
            return ctx.reply("Could not resolve the shortened URL.");
        }
    }

    ctx.reply("𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 𝗜𝗦 𝗦𝗧𝗔𝗥𝗧𝗜𝗡𝗚 𝗣𝗟𝗘𝗔𝗦𝗘 𝗪𝗔𝗜𝗧");

    const videoData = await getTikTokVideo(url);

    if (!videoData) {
        return ctx.reply("Invalid response from API. Please check the link!");
    }

    const { title, hdplay, images } = videoData;

    if (!title) {
        return ctx.reply("No title found for this video.");
    }

    const logMessage = {
        userId: ctx.from.id,
        userName: ctx.from.username || 'No username',
        url: url,
        downloads: 1,
        timestamp: new Date().toISOString(),
    };

    const existingLog = logs.find(log => log.userId === logMessage.userId);
    if (existingLog) {
        existingLog.downloads += 1;
    } else {
        logs.push(logMessage);
    }

    await bot.telegram.sendMessage(adminId, `𝗡𝗘𝗪 𝗧𝗜𝗞𝗧𝗢𝗞 𝗩𝗜𝗗𝗘𝗢 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 :\nUSER ID: ${logMessage.userId}\nUSERNAME: ${logMessage.userName}\nURL: ${logMessage.url}\nTIMESTAMP: ${logMessage.timestamp}`);

    await ctx.reply(`Title: ${title}`);

    if (hdplay) {
        await ctx.replyWithVideo(`https://tikwm.com${hdplay}`);
    }

    if (images && images.length > 0) {
        if (mode === "generic") {
            const elements = images.slice(0, 10).map((img, index) => ({
                title: `Image ${index + 1}`,
                image_url: img,
                subtitle: title || "TikTok Image",
                buttons: [
                    {
                        type: "web_url",
                        url: img,
                        title: "View Full"
                    }
                ]
            }));

            ctx.reply("Note: In generic mode, only the first 10 images will be shown.");
            await ctx.replyWithMediaGroup(
                elements.map(img => ({ type: 'photo', media: img.image_url }))
            );
        } else {
            for (let i = 0; i < images.length; i += 2) {
                const imageBatch = images.slice(i, i + 2).map(img => ({ type: 'photo', media: img }));
                await ctx.replyWithMediaGroup(imageBatch);
            }
        }
    }

    ctx.reply("𝗛𝗢𝗣𝗘 𝗬𝗢𝗨 𝗘𝗡𝗝𝗢𝗬𝗘𝗗 𝗨𝗦𝗜𝗡𝗚 𝗠𝗬 𝗕𝗢𝗧 𝗣𝗟𝗘𝗔𝗦𝗘 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 𝗛𝗘𝗥𝗘: @Nighative - 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥");
});

bot.launch().then(() => {
    console.log("Bot is running...");
});

app.use(cors());
app.use(express.static('public'));

app.get('/logs', (req, res) => {
    res.json(logs);
});

app.listen(3000, () => {
    console.log("Web server is running on http://localhost:3000");
});

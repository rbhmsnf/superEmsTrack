const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const https = require('https');
const express = require('express');
const cheerio = require('cheerio');
const app = express();
const botToken = process.env.token;
const Channel = process.env.channel;
const IdChannel = process.env.idchannel;
const bots = process.env.bots;
const bot = new Telegraf(botToken);

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SB_URL, process.env.SB_KEY, { auth: { persistSession: false } });
// /** db **/

function deleteWordBeforeSpace(str) {




    // let words = str.split(" ");

    // if (words.length >= 2) {
    //     words.splice(words.length - 2, 1);
    // }
    // return words.join(" ");
    let array = [str];
    let lastWord = array[array.length - 1];
    let remainingPart = array[0].slice(array[0].lastIndexOf(" ") + 1);
    array[0] = remainingPart;
    return array

}


async function createUser(user) {
    const { data, error } = await supabase
        .from('users')
        .insert([user]);

    if (error) {
        throw new Error('Error creating user : ', error);
    } else {
        return data
    }
};

async function updateUser(id, update) {
    const { data, error } = await supabase
        .from('users')
        .update(update)
        .eq('id', id);

    if (error) {
        throw new Error('Error updating user : ', error);
    } else {
        return data
    }
};
async function userDb(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);

    if (error) {
        console.error('Error checking user:', error);
    } else {
        return data
    }
};

const markup_admin = {
    reply_markup: {
        keyboard: [
            ['طرودي', 'اضافة طرد'],
            ['ازالة طرد', 'اللغة'],
            ['تسمية الطرد'],

        ],
        resize_keyboard: true
    }
};

bot.hears('اضافة طرد', async (ctx) => {
    const markup_track = {
        reply_markup: {
            keyboard: [
                ['الغاء']
            ],
            resize_keyboard: true
        }
    };
    await updateUser(ctx.message.from.id, { mode: "add" })
        .then((data, error) => {
            ctx.reply("ارسل رقم التتبع لاضافة الطرد", markup_track);
        });


});

bot.hears('الغاء', async (ctx) => {

    await updateUser(ctx.message.from.id, { mode: "track" })
        .then((data, error) => {
            ctx.reply('تم الغاء', markup_admin);
        });



});
// Handle 'المنتجات' command
bot.hears('طرودي', async (ctx) => {
    const user = await userDb(ctx.message.from.id);
    const buttonsPerRow = 2;

    const keyboard = [
        ['العودة للصفحة الرئسية']
    ];
    for (let i = 0; i < user[0].track.length; i += buttonsPerRow) {
        keyboard.push(user[0].track.slice(i, i + buttonsPerRow));
    }
    const markup_track = {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    };
    ctx.reply("قائمة الطرود", markup_track);
});

// Handle 'الاحصائيات' command
bot.hears('العودة للصفحة الرئسية', async (ctx) => {
    await ctx.reply("القائمة الرئيسية", markup_admin);
});
let i;
bot.hears('ازالة طرد', async (ctx) => {

    // await updateUser(ctx.message.from.id, { mode: "add" })
    //     .then((data, error) => {

    //     });

    const user = await userDb(ctx.message.from.id);
    const buttonsPerRow = 1;
    const keyboard = [];

    for (i = 0; i < user[0].track.length; i += buttonsPerRow) {
        const row = [];
        for (let j = i; j < i + buttonsPerRow && j < user[0].track.length; j++) {
            row.push({ text: user[0].track[j], callback_data: j.toString() });
        }
        keyboard.push(row);
        console.log(row);
    }

    const replyMarkup = {
        inline_keyboard: keyboard,
    };
    await ctx.reply('ازالة طرد', { reply_markup: replyMarkup });
});


let myindex;
bot.action(/.*/, async (ctx) => {
    const user = await userDb(ctx.from.id);
    const callback_data = ctx.update.callback_query.data;

    if (user[0].mode == "rename") {
        const markup_track = {
            reply_markup: {
                keyboard: [
                    ['الغاء']
                ],
                resize_keyboard: true
            }
        };
        ctx.sendMessage("ارسل اسم جديد", markup_track);
        myindex = callback_data

    }
    else {
        const indexToDelete = parseInt(callback_data);

        if (!isNaN(indexToDelete) && indexToDelete >= 0 && indexToDelete < user[0].track.length) {
            user[0].track.splice(indexToDelete, 1);

            await updateUser(ctx.from.id, { track: user[0].track })
                .then(async (data, error) => {
                    ctx.reply("تم حذف الطرد بنجاح ✅").then(async () => {
                        await updateUser(ctx.from.id, { mode: "track" })
                            .then((data, error) => {

                            });
                    });
                });
        }

        //lang 
        else if (callback_data == "ar") {
            await updateUser(ctx.from.id, { translateok: "ar" })
                .then((data, error) => {
                    ctx.reply('تم تحويل اللغة الى العربية');
                });

        } else if (callback_data == "en") {
            await updateUser(ctx.from.id, { translateok: "en" })
                .then((data, error) => {
                    ctx.reply('تم تحويل اللغة الى English');
                });
        } else if (callback_data == "fr") {
            await updateUser(ctx.from.id, { translateok: "fr" })
                .then((data, error) => {
                    ctx.reply('تم تحويل اللغة الى Français');
                });
        } else {
            await updateUser(ctx.from.id, { translateok: "ar" })
                .then((data, error) => {
                });
        }
        ///
        ///change name item
    }

    ////
});

bot.hears('اللغة', async (ctx) => {



    const keyboard = [
        [{ text: 'العربية', callback_data: "ar" }],
        [{ text: 'ُEnglish', callback_data: "en" }],
        [{ text: 'Français', callback_data: "fr" }],

    ];
    const replyMarkup = {
        inline_keyboard: keyboard,
    };
    await ctx.reply('تغيير اللغة', { reply_markup: replyMarkup });


});
bot.hears('تسمية الطرد', async (ctx) => {
    await updateUser(ctx.from.id, { mode: "rename" })
        .then((data, error) => { });
    const user = await userDb(ctx.message.from.id);
    const buttonsPerRow = 1;
    const keyboard = [];

    for (i = 0; i < user[0].track.length; i += buttonsPerRow) {
        const row = [];
        for (let j = i; j < i + buttonsPerRow && j < user[0].track.length; j++) {
            row.push({ text: user[0].track[j], callback_data: j.toString() });
        }
        keyboard.push(row);
        console.log(row);
    }

    const replyMarkup = {
        inline_keyboard: keyboard,
    };
    await ctx.reply('تسمية الطرد', { reply_markup: replyMarkup });

});



async function isUserSubscribed(user_id) {
    try {
        const user_info = await bot.telegram.getChatMember(IdChannel, user_id);
        console.log(user_info);
        return ['member', 'administrator', 'creator'].includes(user_info.status);
    } catch (e) {
        console.error(`حدث خطأ: ${e.message}`);
        return false;
    }
}


app.use(express.json());
app.use(bot.webhookCallback('/bot'))

app.get('/', (req, res) => { res.sendStatus(200) });

app.get('/ping', (req, res) => { res.status(200).json({ message: 'Ping successful' }); });


function keepAppRunning() {
    setInterval(() => {
        https.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, (resp) => {
            if (resp.statusCode === 200) {
                console.log('Ping successful');
            } else {
                console.error('Ping failed');
            }
        });
    }, 5 * 60 * 1000);
}

bot.command(['start', 'help'], async (ctx) => {
    const userIdToCheck = ctx.message.from.id;
 console.log(userIdToCheck)
    if (await isUserSubscribed(userIdToCheck)) {
        const welcomeMessage = `
مرحبًا بك في بوت تتبع الطرود! 📦✨

نحن هنا لمساعدتك في تتبع طرودك بسهولة ويسر. ما عليك سوى إرسال رقم الطرد الخاص بك، وسنقوم بتزويدك بآخر المعلومات حول حالة الشحنة في الحال.

معنا، لن تفقد طردًا مرة أخرى! لا تتردد في طرح أي استفسارات أو مساعدة أخرى.

بانتظار خدمتك، 🤖📦
        `;

        try {
            const user = await userDb(ctx.message.from.id);

            if (user && user.length > 0) { // المستخدم موجود
                await ctx.reply(welcomeMessage, markup_admin);
            } else {
                await createUser({ id: ctx.message.from.id, mode: "track", track: [] });
                await ctx.reply(welcomeMessage, markup_admin);
            }
        } catch (error) {
            console.error('Error accessing or creating user:', error);
            ctx.reply('حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى لاحقًا.');
        }
    } else {
        const replyMarkup2 = {
            inline_keyboard: [
                [{ text: 'اشتراك', url: Channel }],
            ],
        };
        ctx.reply('أنت غير مشترك في القناة.', { reply_markup: replyMarkup2 });
    }
});


async function track_cainio(message) {
    const get_idTrack = message;

    try {
        const response = await axios.get(`https://global.cainiao.com/global/detail.json?mailNos=${get_idTrack}&lang=en-US&language=en-US`);
        const get_api = response.data;

        const module_data = get_api.module || [];
        const detail_list = module_data[0]?.detailList || [];
        const tracking_data = {
            detail_list: detail_list
        };

        return tracking_data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function track(message) {
    try {
        const data = {
            "trackcode": message,
            "push": true,
            "import": {},
            "lang": "en",
            "destination_country": "SA"
        };

        const response = await axios.post('https://1trackapp.com/api/v2/tracking?userid=4184671.65bc187bd61b3', data);
        const trackingData = response.data.data;

        const detailList = trackingData?.events || [];

        const trackingDetails = detailList.map(detail => ({
            standerd_desc: detail.attribute,
            timeStr: detail.courier,
            place: detail.place,
            date: detail.date,
            status: detail.status

        }));

        return trackingDetails;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return null;
    }
}


async function Ems(tracks) {
    try {
        const url = `https://ems.dz/track/index.php?icd=${tracks}`;
        const response = await axios.get(url);
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);

        const timeline = $(".cd-timeline__content.js-cd-content");
        let listdetails = ''; // Initialize listdetails

        if (timeline.length > 0) {
            timeline.each((index, element) => {
                const h2 = $(element).find('h2').text().trim();
                const p = $(element).find('p').text().trim();
                const date = $(element).find('.cd-timeline__date').text().trim();
                listdetails += `✈️${h2}\n 📍${p}\n🕐${date}\n${'-'.repeat(30)}\n`;
            });

            return listdetails; // Return the constructed listdetails
        } else {
            return "Timeline not found";
        }
    } catch (error) {
        console.log("Error:", error);
        return "Error occurred"; // Return an error message
    }
}

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    const userIdToCheck = ctx.message.from.id;
    const user = await userDb(ctx.message.from.id);
    console.log(user[0].mode)
    if (user[0].mode == "track") {
        if (await isUserSubscribed(userIdToCheck)) {
            console.log('t')
            try {
                if (text === "/start") {
                    console.log("ok");
                } else {
                    try {

                        ctx.reply('انتظر قليلا ...').then((messages) => {
                            let newString = deleteWordBeforeSpace(text);
                            (async () => {

                                var named = "";
                                try {
                                    const trackEms = await Ems(newString[0]);
                                    let detailsText = "";
                                    if (trackEms == "Timeline not found") {

                                        console.log(newString[0]);
                                        const trackingResult = await track(newString[0]);

                                        if (trackingResult && trackingResult.length > 0) {
                                            for (const detail of trackingResult) {
                                                const standerdDesc = detail.standerd_desc;
                                                const place = detail.place;
                                                const date = detail.date;
                                                named = "OneTrack"
                                                if (place === undefined) {
                                                    detailsText += `✈️ ${standerdDesc}\n🕐${date}\n${'-'.repeat(30)}\n`;
                                                } else {
                                                    detailsText += `✈️ ${standerdDesc}\n${place}\n🕐${date}\n${'-'.repeat(30)}\n`;
                                                }
                                            }
                                        } else {
                                            const s = await track_cainio(newString[0]);
                                            for (const detail of s.detail_list) {
                                                const standerd_desc = detail.standerdDesc;
                                                const timeStr = detail.timeStr;
                                                named = "Cainiao"
                                                detailsText += `✈️${standerd_desc}\n 🕐${timeStr}\n${'-'.repeat(30)}\n`;
                                            }
                                        }

                                    } else {
                                        detailsText = trackEms;
                                        named = 'EmsDz'
                                    }

                                    const send = `
Information about the Expulsion :

${detailsText} 

By ${named}
`;


                                    const replyMarkup = await {
                                        inline_keyboard: [

                                            [{ text: 'انضم الى قناتنا', url: Channel }],
                                            [{ text: 'جرب بوت تخفيض النقاط', url: bots },],


                                        ],
                                    };
                                    if (user[0].translateok == "ar") {
                                        const translate = import("translate").then(module => {
                                            const translate = module.default;

                                            translate(send, { to: "ar" }).then(text => {
                                                bar = 'https://barcodeapi.org/api/' + newString;
                                                ctx.replyWithPhoto({ url: bar }).then(() => {
                                                    ctx.sendMessage(text, { reply_markup: replyMarkup }).then(() => {
                                                        ctx.deleteMessage(messages.message_id)
                                                    })
                                                })

                                            });
                                        }).catch(err => {
                                            console.error('Error:', err);
                                        });

                                    } else if (user[0].translateok == "en") {
                                        bar = 'https://barcodeapi.org/api/' + newString;
                                        ctx.replyWithPhoto({ url: bar }).then(() => {
                                            ctx.sendMessage(send, { reply_markup: replyMarkup }).then(() => {
                                                ctx.deleteMessage(messages.message_id)
                                            })
                                        })
                                    } else if (user[0].translateok == "fr") {
                                        const translate = import("translate").then(module => {
                                            const translate = module.default;

                                            translate(send, { to: "fr" }).then(text => {
                                                bar = 'https://barcodeapi.org/api/' + newString;
                                                ctx.replyWithPhoto({ url: bar }).then(() => {
                                                    ctx.sendMessage(text, { reply_markup: replyMarkup }).then(() => {
                                                        ctx.deleteMessage(messages.message_id)
                                                    })
                                                })

                                            });
                                        }).catch(err => {
                                            console.error('Error:', err);
                                        });
                                    } else {
                                        const translate = import("translate").then(module => {
                                            const translate = module.default;

                                            translate(send, { to: "ar" }).then(text => {
                                                bar = 'https://barcodeapi.org/api/' + newString;
                                                ctx.replyWithPhoto({ url: bar }).then(() => {
                                                    ctx.sendMessage(text, { reply_markup: replyMarkup }).then(() => {
                                                        ctx.deleteMessage(messages.message_id)
                                                    })
                                                })

                                            });
                                        }).catch(err => {
                                            console.error('Error:', err);
                                        });

                                    }

                                } catch (error) {
                                    console.error('Error:', error);
                                    ctx.sendMessage("رقم التتبع خاطئ")
                                }
                            })();

                        });
                    }
                    catch (e) {

                    }
                }
            } catch (e) {
                ctx.reply('حدث خطأ غير متوقع');
            }
        } else {
            const replyMarkup2 = {
                inline_keyboard: [
                    [{ text: 'اشتراك', url: Channel }],
                ],
            };
            ctx.reply(' اأنت غير مشترك في القناة.', { reply_markup: replyMarkup2 });
        }
    } else if (user[0].mode == "add") {
        user[0].track.push(" " + ctx.message.text)
        await updateUser(ctx.message.from.id, { track: user[0].track })
            .then((data, error) => {
                ctx.reply("تم اضافة الطرد✅", markup_admin).then(async () => {
                    await updateUser(ctx.message.from.id, { mode: "track" })
                        .then((data, error) => { });
                });
            });
    } else if (user[0].mode == "rename") {
        try {

            const indexToRename = parseInt(myindex);
            console.log(indexToRename)

            let parts = user[0].track[indexToRename].split(" ");
            parts[0] = ctx.message.text;
            console.log(parts[0])
            user[0].track[indexToRename] = parts.join(" ");
            try {
                await updateUser(ctx.message.from.id, { track: user[0].track }).then((data, error) => {
                    ctx.reply("تم تغيير اسم الطرد✅", markup_admin).then(async () => {
                        await updateUser(ctx.message.from.id, { mode: "track" })
                            .then((data, error) => { });
                    });
                });
            } catch (error) {
                console.error("حدث خطأ أثناء تحديث البيانات:", error);
            }

        } catch {
            ctx.reply('اولا عليك اختيار زر ثم قم بتغيير الاسم او الالغاء')
        }

    }


});

app.listen(3000, () => {
    bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/bot`)
        .then(() => {
            console.log('Webhook Set ✅ & Server is running on port 3000 💻');
            keepAppRunning();
        });
});

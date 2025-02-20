require("dotenv").config();

const envs = {
    keyCloudflare: process.env["KEY_CLOUDFLARE"],
    accountIdCloudflare: process.env["ACCOUNT_ID_CLOUDFLARE"],
    databaseIdCloudflare: process.env["DATABASE_ID_CLOUDFLARE"],
    tokenTelegram: process.env["TOKEN_TELEGRAM"],
    chatIdTelegram: process.env["CHATID_TELEGRAM"],
};

module.exports = envs;
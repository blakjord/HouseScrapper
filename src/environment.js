require("dotenv").config();


console.log(process.env["ACCOUNT_ID_CLOUDFLARE"]);
const envs = {
    keyCloudflare: process.env["KEY_CLOUDFLARE"],
    accountIdCloudflare: process.env["ACCOUNT_ID_CLOUDFLARE"],
    databaseIdCloudflare: process.env["DATABASE_ID_CLOUDFLARE"],
};

module.exports = envs;
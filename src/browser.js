const { chromium } = require('playwright');

async function startBrowser(){
    process.env.DEBUG = 'puppeteer:*';

    let browser;
    try {
        console.log("Opening the browser......");
        browser = await chromium.launch({
            args: ["--no-sandbox"],
            'ignoreHTTPSErrors': true
        });
    } catch (err) {
        console.log("Could not create a browser instance => : ", err);
    }
    return browser;
}

module.exports = {
    startBrowser
};
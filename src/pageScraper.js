const parser = require('./pageParser.js');

const scraperObject = {
    changeLogUrl: 'https://dev.twitch.tv/docs/change-log',
    helixUrl: 'https://dev.twitch.tv/docs/api/reference',
    async getLatestUpdateDate(browser){
        let page = await browser.newPage();
        console.log(`Navigating to ${this.changeLogUrl}...`);
        await page.goto(this.changeLogUrl);
        // Wait for the required DOM to be rendered
        await page.mainFrame().waitForSelector('.text-content table tr td');
        // Get the link to all the required books
        return await page.evaluate(() => document.querySelectorAll('.text-content table tr')[1].querySelector('td').textContent);
    },

    async getAllDocParts(browser) {
        let page = await browser.newPage();
        page.on('console', msg => console.log(msg.text()));
        console.log(`Navigating to ${this.helixUrl}...`);
        await page.goto(this.helixUrl);
        // Wait for the required DOM to be rendered
        await page.mainFrame().waitForSelector('code');
        // Get the link to all the required books
        return await page.evaluate(parser);
    }
}

module.exports = scraperObject;
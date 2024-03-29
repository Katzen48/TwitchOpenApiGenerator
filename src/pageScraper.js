const parser = require('./pageParser.js');
const authParser = require('./authenticationPageParser.js');

const scraperObject = {
    changeLogUrl: 'https://dev.twitch.tv/docs/change-log',
    helixUrl: 'https://dev.twitch.tv/docs/api/reference',
    scopesUrl: 'https://dev.twitch.tv/docs/authentication/scopes',
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
    },

    async getScopes(browser, routes) {
        let page = await browser.newPage();
        page.on('console', msg => console.log(msg.text()));
        console.log(`Navigating to ${this.scopesUrl}...`);
        await page.goto(this.scopesUrl);
        // Wait for the required DOM to be rendered
        await page.mainFrame().waitForSelector('table');
        return await page.evaluate(authParser, routes);
    }
}

module.exports = scraperObject;
const pageScraper = require('./pageScraper');
const formatter = require('./openApiFormatter');

async function scrapeAll(browserInstance, docs){
    let browser;
    try {
        browser = await browserInstance;
        let latestUpdateDate = await pageScraper.getLatestUpdateDate(browser);

        console.log('Docs version', latestUpdateDate);
        if (!docs || docs.info.version !== latestUpdateDate) {
            console.log('Update available');
        }

        let routes = await pageScraper.getAllDocParts(browser);
        routes = await pageScraper.getScopes(browser, routes);
        docs = formatter.toOpenApi(routes, latestUpdateDate);
    }
    catch(err) {
        console.log("Could not resolve the browser instance => ", err);
    } finally {
        await browser.close();
    }

    return docs;
}

module.exports = (browserInstance, docs) => scrapeAll(browserInstance, docs)
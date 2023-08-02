const core = require('@actions/core');

const pageScraper = require('./pageScraper');
const formatter = require('./openApiFormatter');

async function scrapeAll(browserInstance, docs){
    let summary = core.summary.addHeading('Result');
    let browser;
    try {
        browser = await browserInstance;
        let latestUpdateDate = await pageScraper.getLatestUpdateDate(browser);

        console.log('Docs version', latestUpdateDate);
        if (!docs || docs.info.version !== latestUpdateDate) {
            console.log('Update available');
        }

        let endpointSummary = [[
            {data: 'Endpoint', header: true},
            {data: 'Method', header: true},
            {data: 'Responses', header: true },
            {data: 'Scopes', header: true},
            {data: 'Request Body', header: true}
        ]];
        let routes = await pageScraper.getAllDocParts(browser);
        routes = await pageScraper.getScopes(browser, routes);
        docs = formatter.toOpenApi(routes, latestUpdateDate, endpointSummary);

        summary = summary.addTable(endpointSummary);
    }
    catch(err) {
        console.log("Could not resolve the browser instance => ", err);
    } finally {
        await browser.close();
        await summary.write();
    }

    return docs;
}

module.exports = (browserInstance, docs) => scrapeAll(browserInstance, docs)
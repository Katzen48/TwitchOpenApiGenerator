const browserObject = require('./browser');
const scraperController = require('./pageController');
const fs = require('fs');
const YAML = require('yaml');

(async function () {
    let docs;
    if (fs.existsSync('./swagger.yaml')) {
        const file = fs.readFileSync('./swagger.yaml');
        docs = YAML.parse(file.toString());

        if (docs) {
            console.log('Docs are at version', docs.info.version);
        }
    }

    //Start the browser and create a browser instance
    let browserInstance = browserObject.startBrowser();

// Pass the browser instance to the scraper controller
    let newDocs = await scraperController(browserInstance, docs);

    if (newDocs) {
        fs.writeFileSync('./swagger.yaml', YAML.stringify(newDocs, {aliasDuplicateObjects: false}));
    }

    process.exit();
})();

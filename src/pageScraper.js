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
        return await page.evaluate(() => {
            let routes = [];
            let docParts = document.querySelectorAll('.doc-content .left-docs');

            return Array.from(docParts).slice(1).map(el => {
                let children = Array.from(el.children);

                let urlHeadlineIndex = children.findIndex(child => child.innerText.toLowerCase().startsWith('url') && child.tagName === 'H3');
                let urlIndex = children.slice(urlHeadlineIndex).findIndex(child => child.tagName === 'P');

                let bodyParametersHeadlineIndex = children.findIndex(child => child.innerText.toLowerCase().includes('body parameter') && child.tagName === 'H3');
                let bodyParametersIndex = bodyParametersHeadlineIndex === -1 ? -1 :
                        children.slice(bodyParametersHeadlineIndex).findIndex(child => child.tagName === 'TABLE');

                let queryParametersHeadlineIndex = children.findIndex(child => child.innerText.toLowerCase().includes('query parameter') && child.tagName === 'H3');
                let queryParametersIndex = queryParametersHeadlineIndex === -1 ? -1 :
                        children.slice(queryParametersHeadlineIndex).findIndex(child => child.tagName === 'TABLE');

                let responseFieldsHeadlineIndex = children.findIndex(child => (child.innerText.toLowerCase().includes('response field') ||
                        child.innerText.toLowerCase().includes('return')) && child.tagName === 'H3');
                let responseFieldsIndex = responseFieldsHeadlineIndex === -1 ? -1 :
                        children.slice(responseFieldsHeadlineIndex).findIndex(child => child.tagName === 'TABLE');


                let urlField = children[urlIndex + urlHeadlineIndex].innerText;
                let urlParts = urlField.split(' ');
                let methodPart = urlParts[0].toUpperCase();
                let url = urlParts[1];

                let bodyParameters = bodyParametersIndex === -1 ? [] :
                    Array.from(children[bodyParametersIndex + bodyParametersHeadlineIndex].querySelectorAll('tbody tr'))
                        .filter(tr => !!tr.querySelector('code'))
                        .map(child => {
                            return {
                                name: child.children[0].querySelector('code').innerText,
                                type: child.children[1].innerText,
                            }
                        });

                let queryParameters = queryParametersIndex === -1 ? [] :
                    Array.from(children[queryParametersIndex + queryParametersHeadlineIndex].querySelectorAll('tbody tr'))
                        .filter(tr => !!tr.querySelector('code'))
                        .map(child => {
                            return {
                                name: child.children[0].querySelector('code').innerText,
                                type: child.children[1].innerText,
                            }
                        });

                let responseFields = responseFieldsIndex === -1 ? [] :
                    Array.from(children[responseFieldsIndex + responseFieldsHeadlineIndex].querySelectorAll('tbody tr'))
                        .filter(tr => !!tr.querySelector('code'))
                        .map(child => {
                            return {
                                name: child.children[0].querySelector('code').innerText,
                                type: child.children[1].innerText,
                            }
                        });

                return {
                    method: methodPart in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] ? methodPart : 'GET',
                    url: url ? url : urlField,
                    bodyParameters,
                    queryParameters,
                    responseFields,
                }
            })
        });
    }
}

module.exports = scraperObject;
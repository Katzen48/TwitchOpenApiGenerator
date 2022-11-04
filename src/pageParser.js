module.exports = function () {
    function extractTableData(domTable) {
        let columns = [];
        let elements = [];

        for (let i = 0; i < domTable.rows[0].cells.length; i++) {
            columns.push(domTable.rows[0].cells[i].innerText);
        }

        for (let i = 1; i < domTable.rows.length; i++) {
            elements.push(domTable.rows[i]);
        }

        return elements.map(row => {
            let object = {};

            for (let i = 0; i < columns.length; i++) {
                let column = columns[i];
                let cell = row.cells[i];
                let value;

                if (cell.children.length === 1 && cell.children[0].href) {
                    value = {
                        text: cell.children[0].innerText,
                        url: cell.children[0].href,
                    }
                } else {
                    value = cell.innerText;
                }

                object[column] = value;
            }

            return object;
        });
    }

    let endpoints = [];

    extractTableData(document.querySelectorAll('.doc-content .left-docs table')[0]).forEach(tableEndpoint => {
        let hashIndex = tableEndpoint.Endpoint.url.lastIndexOf('#') + 1;
        let id = tableEndpoint.Endpoint.url.substring(hashIndex);
        let el = document.getElementById(id).parentElement.parentElement;

        let children = Array.from(el.children);
        let leftDocs = children.filter(child => child.classList.contains('left-docs'))[0];
        let leftDocsChildren = Array.from(leftDocs.children);
        let rightCode = Array.from(el.querySelectorAll('.right-code .language-json code'))
        let example = rightCode.length > 0 ? rightCode[0].innerText : null;

        let urlHeadlineIndex = leftDocsChildren.findIndex(child => child.innerText.toLowerCase().startsWith('url') && child.tagName === 'H3');
        let urlIndex = leftDocsChildren.slice(urlHeadlineIndex).findIndex(child => child.tagName === 'P');

        let bodyParametersHeadlineIndex = leftDocsChildren.findIndex(child => child.innerText.toLowerCase().includes('body parameter') && child.tagName === 'H3');
        let bodyParametersIndex = bodyParametersHeadlineIndex === -1 ? -1 :
            leftDocsChildren.slice(bodyParametersHeadlineIndex).findIndex(child => child.tagName === 'TABLE');

        let queryParametersHeadlineIndex = leftDocsChildren.findIndex(child => child.innerText.toLowerCase().includes('query parameter') && child.tagName === 'H3');
        let queryParametersIndex = queryParametersHeadlineIndex === -1 ? -1 :
            leftDocsChildren.slice(queryParametersHeadlineIndex).findIndex(child => child.tagName === 'TABLE');

        let responseFieldsHeadlineIndex = leftDocsChildren.findIndex(child => (child.innerText.toLowerCase().includes('response field') ||
            child.innerText.toLowerCase().includes('return')) && child.tagName === 'H3');
        let responseFieldsIndex = responseFieldsHeadlineIndex === -1 ? -1 :
            leftDocsChildren.slice(responseFieldsHeadlineIndex).findIndex(child => child.tagName === 'TABLE');

        let urlField = leftDocsChildren[urlIndex + urlHeadlineIndex].innerText;

        let urlParts = urlField.split(' ');
        let methodPart = urlParts[0].toUpperCase();
        let url = urlParts[1];

        let bodyParameters = bodyParametersIndex === -1 ? [] :
            Array.from(leftDocsChildren[bodyParametersIndex + bodyParametersHeadlineIndex].querySelectorAll('tbody tr'))
                .filter(tr => !!tr.children[0].querySelector('code'))
                .map(child => {
                    return {
                        name: child.children[0].querySelector('code').innerText,
                        type: child.children[1].innerText,
                    }
                });

        let queryParameters = queryParametersIndex === -1 ? [] :
            Array.from(leftDocsChildren[queryParametersIndex + queryParametersHeadlineIndex].querySelectorAll('tbody tr'))
                .filter(tr => !!tr.children[0].querySelector('code'))
                .map(child => {
                    return {
                        name: child.children[0].querySelector('code').innerText,
                        type: child.children[1].innerText,
                    }
                });

        let responseFields = responseFieldsIndex === -1 ? [] :
            Array.from(leftDocsChildren[responseFieldsIndex + responseFieldsHeadlineIndex].querySelectorAll('tbody tr'))
                .filter(tr => !!tr.children[0].querySelector('code'))
                .map(child => {
                    return {
                        name: child.children[0].querySelector('code').innerText,
                        type: child.children[1].innerText,
                    }
                });

        const possibleMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        endpoints.push({
            method: possibleMethods.includes(methodPart) ? methodPart : 'GET',
            url: url ? url : urlField,
            bodyParameters,
            queryParameters,
            responseFields,
            summary: tableEndpoint.Endpoint.text,
            description: tableEndpoint.Description,
            tags: [tableEndpoint.Resource],
            example,
            id: id.toLowerCase(),
        });
    });

    return endpoints;
}
module.exports = function (routes) {
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

                if (i === 0) {
                    object[column] = cell.innerText;
                } else {
                    let values = [];
                    let description = cell.childNodes.length > 1 && cell.childNodes[0].nodeType === 3 ? cell.childNodes[0].nodeValue : null;

                    cell.querySelectorAll('a').forEach(link => {
                        values.push({
                            description,
                            text: link.innerText,
                            url: link.href.substring(link.href.indexOf('#') + 1).toLowerCase()
                        });
                    });

                    object[column] = values;
                }
            }

            return object;
        });
    }

    let scopes = {};
    extractTableData(document.querySelectorAll('.text-content table')[0]).forEach(scope => {
        scope['Type of Access and Associated Endpoints'].forEach(endpoint => {
            if (!endpoint.hasOwnProperty('url')) {
                return;
            }

            if (!scopes.hasOwnProperty(endpoint.url)) {
                scopes[endpoint.url] = new Set();
            }

            scopes[endpoint.url].add({
                name: scope['Scope Name'],
                description: endpoint.description ? endpoint.description.replace(/[\n\r]/g, '') : scope['Scope Name'],
            });
        });
    });

    return routes.map(route => {
        let routeScopes = scopes[route.id];
        if (!routeScopes) {
            routeScopes = [];
        }

        route.scopes = Array.from(routeScopes);

        return route;
    });
}
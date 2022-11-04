class Parser {
    constructor(routes) {
        this.routes = routes;
    }

    extractTableData(domTable) {
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

                    cell.querySelectorAll('a').forEach(link => {
                        values.push({
                            text: link.innerText,
                            url: link.href
                        });
                    });

                    object[column] = values;
                }
            }

            return object;
        });
    }

    parse() {
        let scopes = {};
        this.extractTableData(document.querySelectorAll('.text-content table')[0]).forEach(scope => {
            scope['Type of Access and Associated Endpoints'].forEach(endpoint => {
                if (!scopes.hasOwnProperty(endpoint.url.toLowerCase())) {
                    scopes[endpoint.url.toLowerCase()] = new Set();
                }

                scopes[endpoint.url.toLowerCase()].add(scope['Scope Name']);
            });
        });

        return this.routes.map(route => {
            route.scopes = scopes[route.docsPath];

            return route;
        });
    }
}

module.exports = Parser;
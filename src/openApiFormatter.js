const HOST = 'api.twitch.tv';
const BASE_PATH = '/helix';
const SCHEME = 'https';
const BASE_URL = `${SCHEME}://${HOST}${BASE_PATH}`;

const formatter = {
    mapPropertiesToOpenApi(object) {
        let type = typeof object;

        if (object === null) {
            type = "string";
        }

        if (type === 'object') {
            if (Array.isArray(object)) {
                type = 'array';
                let items = {
                    type: 'string',
                };

                if (object.length > 0) {
                    items = this.mapPropertiesToOpenApi(object[0]);
                }

                return {
                    type,
                    items,
                }
            } else {
                let properties = {};

                for (const property of Object.keys(object)) {
                    properties[property] = this.mapPropertiesToOpenApi(object[property]);
                }

                return {
                    type,
                    properties,
                };
            }
        }

        return {
            type,
        };
    },
    mapResponseFromExample(example) {
        try {
            let json = example.replaceAll('\n', '').replace(new RegExp('[}][,]?[\\s]+[\\.]{3}', 'g'), "}");
            return this.mapPropertiesToOpenApi(JSON.parse(json))
        } catch (error) {
            console.error(error);

            return null;
        }
    },
    mapDataType(dataType) {
        switch (dataType.toLocaleString()) {
            /*
            case 'string array':
                return 'array';
             */
                /*
            case 'string[]':
                return 'array';
                 */
            case 'boolean':
                return 'boolean';
            case 'integer':
                return 'integer';
            case 'object':
                return 'object';
                /*
            case 'array':
                return 'array';
                 */
                /*
            case 'array of objects':
                return 'array';
                */
            case 'float':
                return 'number';
            default:
                return 'string';
        }
    },
    toOpenApi(json, version) {
        let paths = {};

        json.forEach(path => {
            let route = path.url.slice(path.url.indexOf(BASE_PATH) + BASE_PATH.length).split('?')[0];
            let responses = {
                401: {
                    description: 'Unauthenticated: Missing/invalid Token',
                },
                404: {
                    description: 'Not Found',
                },
                500: {
                    description: 'Internal Server Error: Something bad happened on our side',
                },
            };
            let body = {
                in: 'body',
                name: '',
                schema: {
                    type: 'object',
                    properties: {},
                }
            };
            let parameters = [];

            path.queryParameters.forEach(parameter => {
                parameters[parameters.length] = {
                    name: parameter.name,
                    in: 'query',
                    schema: {
                        type: this.mapDataType(parameter.type),
                    },
                };
            });

            path.bodyParameters.forEach(parameter => {
                body['schema']['properties'][parameter.name] = {
                    type: this.mapDataType(parameter.type),
                };
            });

            if (['GET', 'POST', 'PUT', 'PATCH'].includes(path.method)) {
                let responseProperties = this.mapResponseFromExample(path.example);

                if (responseProperties === null) {
                    console.log(path.method, route, "example cannot be parsed");
                }

                responses['200'] = {
                    description: 'OK',
                };

                if (responseProperties) {
                    responses['200'] = Object.assign(responses['200'], {
                        content: {
                            'application/json': {
                                schema: responseProperties,
                            },
                        },
                    });
                }
            } else if (path.method === 'DELETE') {
                responses['204'] = {
                    description: 'Deleted',
                };
            }

            let apiPath = {
                parameters: [
                    {
                        in: 'header',
                        name: 'client_id',
                        required: true,
                        schema: {
                            type: 'string',
                        },
                    },
                ],
            };

            if (route in paths) {
                apiPath = paths[route];
            }

            apiPath[path.method.toLowerCase()] = {
                summary: path.summary,
                description : path.description,
                tags: path.tags,
                /*
                security: [
                    'accessCode',
                ],
                 */
                responses,
            };

            if (parameters.length > 0) {
                apiPath[path.method.toLowerCase()].parameters = parameters;
            }

            if (body.schema.properties.length > 0) {
                apiPath[path.method.toLowerCase()] = Object.assign(apiPath[path.method.toLowerCase()], {
                    consumes: [
                        'application/json',
                    ],
                    parameters: [body],
                });
            }

            paths[route] = apiPath;
        })

        return {
            openapi: '3.0.0',
            servers: [
                {
                    url: BASE_URL,
                    description: 'Production API'
                }
            ],
            externalDocs: {
                description: 'Official documentation',
                url: 'https://dev.twitch.tv/docs/api/',
            },
            info: {
                title: 'Twitch Helix API',
                description: 'The Twitch API is a RESTful API that lets developers build creative integrations for ' +
                    'the broader Twitch community. THIS DOCUMENTATION IS NEITHER MAINTAINED BY OR AFFILIATED WITH TWITCH',
                termsOfService: 'https://www.twitch.tv/p/en/legal/developer-agreement/',
                contact: {
                    name: 'TwitchDev',
                    url: 'https://dev.twitch.tv/support/',
                    email: 'developers@twitch.tv',
                },
                version,
            },
            paths,
        }
    }
}

module.exports = formatter;
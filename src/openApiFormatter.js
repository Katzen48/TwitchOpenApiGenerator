const HOST = 'api.twitch.tv';
const BASE_PATH = '/helix';
const SCHEME = 'https';
const BASE_URL = `${SCHEME}://${HOST}${BASE_PATH}`;

const formatter = {
    mapPropertiesToOpenApi(object) {
        let type = typeof object;
        let example = null;

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
        } else {
            example = object;
        }

        let apiProperty = {
            type,
        };

        if (example) {
            apiProperty['example'] = example;
        }

        return apiProperty;
    },
    mapResponseFromExample(example) {
        if (example === null) {
            return null;
        }

        try {
            let json = example.replaceAll('\n', '')
                // Get rid of `...` in the beginning of an object
                .replace(new RegExp("[\\{][\\s]*([\\.][\\s]?){3}(?=[\\s]*[\"])", "g"), "{")
                // Get rid of `...` in the middle of an object
                .replace(new RegExp("[,][\\s]*([\\.][\\s]?){3}(?=[\\s]*[\"])", "g"), ",")
                // Get rid of `...` at the end of an object
                .replace(new RegExp("[,]?[\\s]*([\\.][\\s]?){3}(?=[\\s]*[\\}])", "g"), "")

                // Get rid of `...` in the beginning of an array
                .replace(new RegExp("[\\[][\\s]*([\\.][\\s]?){3}(?=[\\s]*[\\{])", "g"), "[")
                // Get rid of `...` in the middle of an array
                .replace(new RegExp("[}][,]?[\\s]*([\\.][\\s]?){3}(?=[\\s]*[\\{])", "g"), "},")
                // Get rid of `...` at the end of an array
                .replace(new RegExp("[}][,]?[\\s]*([\\.][\\s]?){3}(?=[\\s]*[\\]])", "g"), "}")

                // Get rid of trailing comma at the end of an array
                .replace(new RegExp("[}][,][\\s]*(?=[\\s]*[\\]])", "g"), "}");

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
        let scopesSet = new Set();

        json.forEach(path => {
            if (path.scopes) {
                path.scopes.forEach(item => scopesSet.add(item));
            }

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
                security: [{
                    oauth: []
                }],
                responses,
            };

            if (parameters.length > 0) {
                apiPath[path.method.toLowerCase()].parameters = parameters;
            }

            if (path.scopes && path.scopes.length > 0) {
                apiPath[path.method.toLowerCase()].security[0].oauth = path.scopes;
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
        });

        let scopes = Array.from(scopesSet);
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
            components: {
                securitySchemes: {
                    oauth: {
                        type: 'oauth2',
                        description: 'Twitch APIs use OAuth 2.0 access tokens to access resources. If you’re not already familiar with the specification, reading it may help you better understand how to get access tokens to use with the Twitch API.',
                        flows: {
                            implicit: {
                                authorizationUrl: 'https://id.twitch.tv/oauth2/authorize',
                                tokenUrl: 'https://id.twitch.tv/oauth2/token',
                                scopes
                            },
                            authorizationCode: {
                                authorizationUrl: 'https://id.twitch.tv/oauth2/authorize',
                                tokenUrl: 'https://id.twitch.tv/oauth2/token',
                                scopes
                            },
                            clientCredentials: {
                                tokenUrl: 'https://id.twitch.tv/oauth2/token',
                                scopes: {}
                            }
                        }
                    }
                }
            }
        }
    }
}

module.exports = formatter;

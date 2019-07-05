"use strict";

const axios = require('axios');
const jwt = require('jsonwebtoken');

const url = process.env.APIURL;
const client = process.env.APICLIENT;
const key = process.env.APIKEY;
const secret = process.env.APISECRET;

const target = {};
const handler = {
    get(target, name) {

		const requestParams = {};

		// Create JWT token to sign request
		const token = jwt.sign({
				data: {
					...requestParams,
					user: {
						key
					},
				}
			},
			secret,
			{
				expiresIn: 10000, // Request is only good for 10 seconds to prevent replay
			});

		const requestOptions = {
			requestParams,
			baseURL: url,
			headers: {
				'Accept': 'application/json',
				'x-access-token': token,
				'x-access-consumer': client
			}
		}

		const instance = axios.create(requestOptions);

        return Object.assign({},
            [
                'get',
                'delete',
                'head'
            ].reduce(
                (o, method) => Object.assign({}, o, {
                    [method](url = '', params = {}) {

                        if (typeof url === 'object') {
                            params = url;
                            url = '';
                        }

                        return instance[method](name + url, {
                            params
                        });
                    }
                }), {}),
            [
                'post',
                'put',
                'patch'
            ].reduce(
                (o, method) => Object.assign({}, o, {
                    [method](url = '', body = {}, params = {}) {

                        if (typeof url === 'object') {
                            params = body;
                            body = url;
                            url = '';
                        }

                        return instance[method](name + url, body, {
                            params
                        });
                    }
                }), {})
        );
    }
};

const apiProxy = new Proxy(target, handler);

module.exports = apiProxy;

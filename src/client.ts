'use strict';

import path from 'path';

import configDefaults from './config';
import signRequest from './sign';
import httpClient from './clients/http-client';
import FruitfulProxy from './proxy';

import { FruitfulApiClient, RequestClient } from './types/types';

const prepareRestUrl = (controller: string, url = ''): string => {
	return path.join(controller, url.toString());
};

const client: FruitfulApiClient = (_apiUrl?: string, _apiUser?: string, _apiKey?: string, _apiSecret?: string): FruitfulProxy => {
	const apiUrl: string = _apiUrl || configDefaults.apiUrl;
	const apiUser: string = _apiUser || configDefaults.apiUser;
	const apiKey: string = _apiKey || configDefaults.apiKey;
	const apiSecret: string = _apiSecret || configDefaults.apiSecret;

	// Make short-expiring access token for authenticating API request
	const token: string = signRequest(apiKey, apiSecret);

	// Create instance of HTTP or Socket (coming soon) client to make requests
	const requestClient: RequestClient = httpClient(apiUrl, apiUser, token);

	const handler: ProxyHandler<any> = {
		get(target: any, prop: PropertyKey): any {
			const controller = prop.toString();

			return Object.assign(
				{},
				['get', 'delete', 'head'].reduce(
					(o, method) =>
						Object.assign({}, o, {
							[method](url = '', params = {}) {
								let apiRoute = controller;

								if (typeof url === 'object') {
									params = url;
									apiRoute = prepareRestUrl(controller, '');
								} else {
									apiRoute = prepareRestUrl(controller, url);
								}

								return requestClient[method](apiRoute, {
									params,
								});
							},
						}),
					{}
				),
				['post', 'put', 'patch'].reduce(
					(o, method) =>
						Object.assign({}, o, {
							[method](url = '', body = {}, params = {}) {
								let apiRoute = controller;

								if (typeof url === 'object') {
									params = body;
									body = url;
									apiRoute = prepareRestUrl(controller, '');
								} else {
									apiRoute = prepareRestUrl(controller, url);
								}

								return requestClient[method](apiRoute, body, {
									params,
								});
							},
						}),
					{}
				)
			);
		},
	};

	// Proxy client contains get/post/patch/put/delete methods
	return new FruitfulProxy({}, handler);
};

export default client;

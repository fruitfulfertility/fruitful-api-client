import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import JSONbig from 'json-bigint';
import os from 'os';
import https from 'https';

const packageJson = require('../../package.json');

const networkInterfaces = os.networkInterfaces();

const clientIp = `eth0` in networkInterfaces && Array.isArray(networkInterfaces.eth0) ? networkInterfaces.eth0[0] : null;
const userAgent = `FruitfulApiClient/${packageJson.version}`;

// Do something with request error
const requestErrorHandler = error => {
	return Promise.reject(error.data ? error.data : error);
};

// Do something with response error
const responseErrorHandler = error => {
	const { response } = error || {};
	const {
		data: { message: errorMessage },
	} = response || { data: {} };

	// Ignore 40s which are just bad logins but not errors
	// if (String(status).startsWith('5')) {
	// 	app.debug('fruitful:errors:api')(`API Error: %s`, error);
	// }

	// return Promise.reject(response.data || error);
	return Promise.reject(error);
};

export default (apiUrl: string, apiUser: string, token: string): AxiosInstance => {
	const axiosConfig: AxiosRequestConfig = {
		baseURL: apiUrl,
		withCredentials: true,
		headers: {
			Accept: 'application/json',
			'x-access-token': token,
			'x-access-consumer': apiUser,
			...(clientIp && { 'CLIENT-IP': clientIp }),
			...(clientIp && { 'X-REAL-IP': clientIp }),
			// Override the default Axios user-agent and instead pass through the requesting client's UA
			...(userAgent && { 'User-Agent': userAgent }),
		},
		transformResponse: data => JSONbig.parse(data),
		maxContentLength: Infinity,
		// Allow connecting to self-signed certificates
		httpsAgent: new https.Agent({
			rejectUnauthorized: false,
		}),
	};

	const axiosClient = axios.create(axiosConfig);

	axiosClient.interceptors.request.use(
		// request => requestHandler(request, requestOptions),
		error => requestErrorHandler(error)
	);

	axiosClient.interceptors.response.use(
		// response => responseHandler(response, requestOptions),
		error => responseErrorHandler(error)
	);

	return axiosClient;
};

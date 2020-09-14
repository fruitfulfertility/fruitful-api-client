export default class FruitfulProxy {
	constructor(target: any, handler: ProxyHandler<any>) {
		return new Proxy(target, handler);
	}
}

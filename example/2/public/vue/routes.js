export default async function () {
	return [
		{ path: '/', component: { template: '<p>Home</p>' }},
		{ path: '/foo', component: { template: '<p>Foo</p>' }}
	];
}
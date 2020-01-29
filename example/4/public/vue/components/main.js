export default async function (options) {
	const { store } = options;
	return {
		store,
		template: `<div id="vue-main">
			<ul>
				<li><router-link to="/">Home</router-link></li>
				<li><router-link to="/foo">Foo</router-link></li>
			</ul>
			<router-view></router-view>
		</div>`
	};
}
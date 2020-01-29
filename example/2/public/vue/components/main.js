export default async function () {
	return {
		template: `<div id="vue-main">
			<ul>
				<li><router-link to="/">Home</router-link></li>
				<li><router-link to="/foo">Foo</router-link></li>
			</ul>
			<router-view></router-view>
		</div>`
	};
}
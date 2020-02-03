export default async function (options) {
	const { store } = options;
	return {
		computed: {
			foo() {
				return this.$store.state.foo;
			}
		},
		mounted() {
			const foos = [
				'berit',
				'bosse',
				'bengt',
				'lina',
				'ludmilla-ludwig',
			];
			setInterval(() => {
				const randomNumber = Math.floor(Math.random()*foos.length);
				this.$store.commit('setFoo', foos[randomNumber]);
			}, 1000);
		},
		serverPrefetch() {
			console.log('wat');
			this.$store.commit('setFoo', 'bosse');
		},
		store,
		template: `<div id="vue-main">
			<ul>
				<li><router-link to="/">Home</router-link></li>
				<li><router-link to="/foo">Foo</router-link></li>
			</ul>
			<router-view></router-view>
			<p>{{ foo }}</p>
		</div>`
	};
}
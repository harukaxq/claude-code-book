<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { provideCart } from '$lib/cart.svelte';
	import '../app.css';

	let { children } = $props();
	const cart = provideCart();
	onMount(() => cart.initialize());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content="デスク周辺用品を扱う小さなECデモ" />
</svelte:head>

<header class="site-header">
	<div class="header-inner">
		<a class="brand" href="/" aria-label="TinyCommerce トップページ">
			<span class="brand-mark" aria-hidden="true"></span>
			<span>TinyCommerce</span>
		</a>
		<nav aria-label="メインナビゲーション">
			<a href="/">商品</a>
			<a href="/cart">カート <span class="count">{cart.itemCount}</span></a>
			<a href="/admin/products">管理</a>
		</nav>
	</div>
</header>

<main>{@render children()}</main>

<footer>
	<p>TinyCommerce — SvelteKitで学ぶ、小さなECアプリ</p>
</footer>

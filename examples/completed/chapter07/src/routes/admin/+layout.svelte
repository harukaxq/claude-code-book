<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();
	const tabs = [
		{ href: '/admin/products', label: '商品' },
		{ href: '/admin/coupons', label: 'クーポン' },
		{ href: '/admin/orders', label: '注文' }
	];
</script>

<div class="admin-bar">
	<nav class="admin-bar-inner" aria-label="管理メニュー">
		<span class="admin-bar-label">管理</span>
		{#each tabs as tab (tab.href)}
			<a href={tab.href} aria-current={page.url.pathname.startsWith(tab.href) ? 'page' : undefined}
				>{tab.label}</a
			>
		{/each}
	</nav>
</div>

{@render children()}

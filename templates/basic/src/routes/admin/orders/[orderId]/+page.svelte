<script lang="ts">
	import OrderDetails from '$lib/components/OrderDetails.svelte';
	let { data } = $props();
</script>

<svelte:head><title>注文詳細 | TinyCommerce</title></svelte:head>
<div class="page">
	<header class="page-header row">
		<div>
			<p class="eyebrow">Admin</p>
			<h1>注文詳細</h1>
		</div>
		<a class="button secondary" href="/admin/orders">注文一覧へ</a>
	</header>
	<section class="panel"><OrderDetails order={data.order} /></section>
</div>

<script lang="ts">
	import OrderDetails from '$lib/components/OrderDetails.svelte';
	let { data } = $props();
</script>

<svelte:head><title>注文完了 | TinyCommerce</title></svelte:head>
<div class="page">
	<header class="page-header">
		<p class="eyebrow">Thank you</p>
		<h1>ご注文ありがとうございます</h1>
		<p class="lead">注文を受け付けました。以下の内容で大切に準備します。</p>
	</header>
	<section class="panel">
		<OrderDetails order={data.order} />
		<div class="actions"><a class="button" href="/">商品一覧へ戻る</a></div>
	</section>
</div>

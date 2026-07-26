<script lang="ts">
	let { data } = $props();
	const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`;
	const dateTime = (date: Date) =>
		new Date(date).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
</script>

<svelte:head><title>注文管理 | TinyCommerce</title></svelte:head>
<div class="page">
	<header class="page-header">
		<p class="eyebrow">Admin</p>
		<h1>注文管理</h1>
		<p class="lead">確定した注文と、その時点の商品情報を確認できます。</p>
	</header>
	<section class="panel">
		{#if data.orders.length === 0}
			<div class="empty">
				<h2>注文はまだありません</h2>
				<p class="muted">ショップから注文すると、ここに表示されます。</p>
			</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead
						><tr
							><th>注文番号</th><th>注文日時</th><th>商品数</th><th>支払合計</th><th>クーポン</th
							><th></th></tr
						></thead
					>
					<tbody
						>{#each data.orders as order (order.id)}<tr
								><td>{order.id}</td><td>{dateTime(order.createdAt)}</td><td>{order.itemCount}</td
								><td>{yen(order.total)}</td><td>{order.couponCode ?? '—'}</td><td
									><a href={`/admin/orders/${order.id}`}>詳細</a></td
								></tr
							>{/each}</tbody
					>
				</table>
			</div>
		{/if}
	</section>
</div>

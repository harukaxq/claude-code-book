<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { useCart } from '$lib/cart.svelte';

	const cart = useCart();
	let isOrdering = $state(false);
	let orderError = $state('');
	const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`;
	onMount(() => void cart.calculate());

	async function placeOrder() {
		isOrdering = true;
		orderError = '';
		try {
			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ items: cart.items, couponCode: cart.couponCode ?? undefined })
			});
			const body = (await response.json()) as { orderId?: string; message?: string };
			if (!response.ok || !body.orderId)
				throw new Error(body.message ?? '注文を確定できませんでした。');
			cart.clear();
			await goto(`/orders/${body.orderId}`);
		} catch (error) {
			orderError = error instanceof Error ? error.message : '注文を確定できませんでした。';
		} finally {
			isOrdering = false;
		}
	}
</script>

<svelte:head><title>注文確認 | TinyCommerce</title></svelte:head>

<div class="page">
	<header class="page-header">
		<p class="eyebrow">Checkout</p>
		<h1>注文内容の確認</h1>
	</header>
	{#if cart.items.length === 0}
		<section class="panel empty">
			<h2>確認する商品がありません</h2>
			<a class="button" href="/">商品を見る</a>
		</section>
	{:else}
		<section class="panel">
			<h2>注文商品</h2>
			{#each cart.summary.items as item (item.productId)}
				<div class="cart-line">
					<div>
						<div class="line-name">{item.productName}</div>
						<div class="line-price">{yen(item.unitPrice)} × {item.quantity}</div>
					</div>
					<strong>{yen(item.lineSubtotal)}</strong>
				</div>
			{/each}
			{#if cart.summary.appliedCoupon}<p class="success">
					クーポン「{cart.summary.appliedCoupon.code}」を適用しています。
				</p>{/if}
			{#each cart.summary.warnings as warning (warning)}<p class="warning">{warning}</p>{/each}
			{#if cart.error}<p class="error">{cart.error}</p>{/if}
			{#if orderError}<p class="error" role="alert">{orderError}</p>{/if}
			<dl class="totals">
				<div>
					<dt>商品小計</dt>
					<dd>{yen(cart.summary.subtotal)}</dd>
				</div>
				<div>
					<dt>クーポン割引</dt>
					<dd>− {yen(cart.summary.couponDiscount)}</dd>
				</div>
				<div>
					<dt>送料</dt>
					<dd>{cart.summary.shippingFee === 0 ? '無料' : yen(cart.summary.shippingFee)}</dd>
				</div>
				<div class="total">
					<dt>支払合計</dt>
					<dd>{yen(cart.summary.total)}</dd>
				</div>
			</dl>
			<div class="actions">
				<a class="button secondary" href="/cart">カートへ戻る</a><button
					disabled={isOrdering || cart.isCalculating || !!cart.error}
					onclick={placeOrder}>{isOrdering ? '注文中…' : '注文を確定する'}</button
				>
			</div>
		</section>
	{/if}
</div>

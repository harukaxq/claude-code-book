<script lang="ts">
	import { onMount } from 'svelte';
	import { useCart } from '$lib/cart.svelte';

	const cart = useCart();
	let couponInput = $state('');
	const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`;
	onMount(() => {
		couponInput = cart.couponCode ?? '';
		void cart.calculate();
	});

	async function changeQuantity(productId: string, quantity: number) {
		cart.setQuantity(productId, quantity);
		await cart.calculate();
	}

	async function remove(productId: string) {
		cart.remove(productId);
		await cart.calculate();
	}

	async function applyCoupon(event: SubmitEvent) {
		event.preventDefault();
		cart.setCouponCode(couponInput);
		await cart.calculate();
	}
</script>

<svelte:head><title>カート | TinyCommerce</title></svelte:head>

<div class="page">
	<header class="page-header">
		<p class="eyebrow">Your cart</p>
		<h1>カート</h1>
	</header>

	{#if cart.items.length === 0}
		<section class="panel empty">
			<h2>カートは空です</h2>
			<p class="muted">気になる商品を見つけにいきましょう。</p>
			<a class="button" href="/">商品を見る</a>
		</section>
	{:else}
		<section class="panel">
			<h2>商品</h2>
			{#each cart.summary.items as item (item.productId)}
				<div class="cart-line">
					<div>
						<div class="line-name">{item.productName}</div>
						<div class="line-price">{yen(item.unitPrice)} / 個</div>
					</div>
					<label
						>数量<input
							class="quantity"
							aria-label={`${item.productName}の数量`}
							type="number"
							min="1"
							max="10"
							value={item.quantity}
							onchange={(event) =>
								changeQuantity(item.productId, Number(event.currentTarget.value))}
						/></label
					>
					<strong>{yen(item.lineSubtotal)}</strong>
					<button class="danger" onclick={() => remove(item.productId)}>削除</button>
				</div>
			{/each}
			{#if cart.summary.items.length === 0}<p class="muted">金額を計算しています…</p>{/if}
		</section>

		<section class="panel">
			<h2>クーポン</h2>
			<form class="coupon-form" onsubmit={applyCoupon}>
				<label
					><span class="muted">クーポンコード</span><input
						bind:value={couponInput}
						placeholder="WELCOME500"
					/></label
				>
				<button type="submit" disabled={cart.isCalculating}>適用</button>
			</form>
			{#each cart.summary.warnings as warning (warning)}<p class="warning">{warning}</p>{/each}
			{#if cart.error}<p class="error" role="alert">{cart.error}</p>{/if}
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
				<a class="button secondary" href="/">買い物を続ける</a><a class="button" href="/checkout"
					>注文確認へ</a
				>
			</div>
		</section>
	{/if}
</div>

<script lang="ts">
	import { useCart } from '$lib/cart.svelte';

	let { data } = $props();
	const cart = useCart();
	let notice = $state('');
	const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`;
	const categoryName = { desk: 'デスク', stationery: '文房具', accessory: 'アクセサリー' };

	function addToCart(productId: string, productName: string) {
		cart.add(productId);
		notice = `${productName}をカートに追加しました。`;
		setTimeout(() => (notice = ''), 2500);
	}
</script>

<svelte:head><title>TinyCommerce | デスクを心地よく</title></svelte:head>

<section class="hero">
	<div class="hero-inner">
		<div class="hero-copy">
			<p class="eyebrow">Small tools, better desk</p>
			<h1>デスクを、<br />少し心地よく。</h1>
			<p class="lead">毎日の作業時間にちょうどいい、シンプルなデスク周辺用品を集めました。</p>
			<a class="button" href="#products">商品を見る</a>
		</div>
		{#if data.products[0]}
			<figure class="hero-visual">
				<img
					src={`${data.imageBaseUrl}/${data.products[0].imageKey}`}
					alt={data.products[0].name}
				/>
			</figure>
		{/if}
	</div>
</section>

<div class="page" class:has-cart-bar={cart.itemCount > 0} id="products">
	<div class="section-head">
		<h2>すべての商品</h2>
		<span class="pill">{data.products.length}アイテム</span>
	</div>

	<section class="product-grid" aria-label="商品一覧">
		{#each data.products as product (product.id)}
			<article class="product-card">
				<a class="product-card-link" href={`/products/${product.id}`}>
					<img src={`${data.imageBaseUrl}/${product.imageKey}`} alt={product.name} />
				</a>
				<div class="product-body">
					<p class="category">{categoryName[product.category]}</p>
					<h2><a href={`/products/${product.id}`}>{product.name}</a></h2>
					<p class="description">{product.description}</p>
					<div class="price-row">
						<div>
							<span class="price">{yen(product.price)}</span>
							<span class:out={product.stock === 0} class="stock"
								>{product.stock > 0 ? '在庫あり' : '在庫切れ'}</span
							>
						</div>
						<button
							disabled={product.stock === 0}
							onclick={() => addToCart(product.id, product.name)}>カートへ</button
						>
					</div>
				</div>
			</article>
		{/each}
	</section>
</div>

{#if cart.itemCount > 0}
	<div class="cart-bar" role="status">
		<div class="cart-bar-inner">
			<span class="cart-bar-note" class:added={!!notice}>
				{#if notice}✓ {notice}{:else}カートに{cart.itemCount}点の商品が入っています。{/if}
			</span>
			<a class="button" href="/cart">カートを見る</a>
		</div>
	</div>
{/if}

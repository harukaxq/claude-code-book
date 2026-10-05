<script lang="ts">
	import { useCart } from '$lib/cart.svelte';

	let { data, form } = $props();
	const cart = useCart();
	const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`;
	const date = (value: Date | string) =>
		new Date(value).toLocaleDateString('ja-JP', { dateStyle: 'medium' });
	const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);
	let notice = $state('');

	function addToCart() {
		cart.add(data.product.id);
		notice = `${data.product.name}をカートに追加しました。`;
	}
</script>

<svelte:head><title>{data.product.name} | TinyCommerce</title></svelte:head>

<div class="page">
	<a class="back-link" href="/">← 商品一覧へ戻る</a>
	<section class="product-detail">
		<img src={`${data.imageBaseUrl}/${data.product.imageKey}`} alt={data.product.name} />
		<div>
			<p class="eyebrow">Product</p>
			<h1>{data.product.name}</h1>
			{#if data.averageRating !== null}
				<p class="rating-summary">
					<span aria-hidden="true">★</span>
					{data.averageRating.toFixed(1)}（{data.reviewCount}件）
				</p>
			{:else}
				<p class="muted">レビューはまだありません</p>
			{/if}
			<p class="lead">{data.product.description}</p>
			<p class="detail-price">{yen(data.product.price)}</p>
			<p class:out={data.product.stock === 0} class="stock">
				{data.product.stock > 0 ? '在庫あり' : '在庫切れ'}
			</p>
			<button disabled={data.product.stock === 0} onclick={addToCart}>カートへ追加</button>
			{#if notice}<p class="success">{notice}</p>{/if}
		</div>
	</section>

	<section class="review-layout">
		<div class="panel">
			<h2>レビュー（{data.reviewCount}件）</h2>
			{#if data.reviews.length === 0}
				<p class="muted">レビューはまだありません。</p>
			{:else}
				<div class="review-list">
					{#each data.reviews as review (review.id)}
						<article class="review-item">
							<div class="review-meta">
								<strong class="stars" aria-label={`5点中${review.rating}点`}
									>{stars(review.rating)}</strong
								>
								<span>購入者・{date(review.createdAt)}</span>
							</div>
							<p>{review.comment}</p>
						</article>
					{/each}
				</div>
			{/if}
		</div>

		<div class="panel">
			<h2>レビューを投稿</h2>
			{#if form?.message}
				<p class:success={form.success} class:error={!form.success}>{form.message}</p>
			{/if}
			{#if data.reviewEligibility === 'can-review'}
				<form method="POST" action="?/review">
					<div class="form-grid one-column">
						<label
							>評価<select name="rating" required>
								<option value="5">★★★★★（5）</option>
								<option value="4">★★★★☆（4）</option>
								<option value="3">★★★☆☆（3）</option>
								<option value="2">★★☆☆☆（2）</option>
								<option value="1">★☆☆☆☆（1）</option>
							</select></label
						>
						<label
							>コメント<textarea name="comment" minlength="1" maxlength="200" required
							></textarea></label
						>
					</div>
					<div class="actions"><button type="submit">レビューを投稿</button></div>
				</form>
			{:else if data.reviewEligibility === 'already-reviewed'}
				<p class="muted">この商品にはレビュー投稿済みです。</p>
			{:else}
				<p class="muted">購入済みで、まだレビューしていない商品に投稿できます。</p>
			{/if}
		</div>
	</section>
</div>

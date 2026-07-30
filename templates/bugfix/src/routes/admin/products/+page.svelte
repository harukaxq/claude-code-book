<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	let { data, form } = $props();
	const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`;
	const categoryName = { desk: 'デスク', stationery: '文房具', accessory: 'アクセサリー' };

	type Product = (typeof data.products)[number];
	let createOpen = $state(false);
	let editing = $state<Product | null>(null);
	let editOpen = $state(false);

	function openEdit(product: Product) {
		editing = product;
		editOpen = true;
	}
</script>

<svelte:head><title>商品管理 | TinyCommerce</title></svelte:head>
<div class="page">
	<header class="page-header row">
		<div>
			<p class="eyebrow">Admin</p>
			<h1>商品管理</h1>
			<p class="lead">商品情報、在庫、ショップへの公開状態を管理します。</p>
		</div>
		<button onclick={() => (createOpen = true)}>商品を追加</button>
	</header>
	{#if form?.message}<p class:success={form.success} class:error={!form.success}>
			{form.message}
		</p>{/if}

	<section class="panel">
		<h2>登録済みの商品（{data.products.length}件）</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>商品名</th>
						<th>カテゴリ</th>
						<th class="num">価格</th>
						<th class="num">在庫</th>
						<th>公開状態</th>
						<th class="num"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.products as product (product.id)}
						<tr>
							<td class="strong">{product.name}</td>
							<td>{categoryName[product.category]}</td>
							<td class="num">{yen(product.price)}</td>
							<td class="num">{product.stock}</td>
							<td
								><span class="status" class:on={product.isActive}
									>{product.isActive ? '公開' : '非公開'}</span
								></td
							>
							<td class="num"
								><button class="secondary small" onclick={() => openEdit(product)}>編集</button></td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>

<Modal bind:open={createOpen} title="新しい商品を登録">
	<form method="POST" action="?/create">
		<div class="form-grid">
			<label>商品名<input name="name" required maxlength="100" /></label>
			<label
				>カテゴリ<select name="category"
					><option value="desk">デスク</option><option value="stationery">文房具</option><option
						value="accessory">アクセサリー</option
					></select
				></label
			>
			<label class="wide">説明<textarea name="description" required maxlength="500"></textarea></label>
			<label>価格（円）<input name="price" type="number" min="0" required /></label>
			<label>在庫数<input name="stock" type="number" min="0" required /></label>
			<label class="wide"
				>画像キー<input
					name="imageKey"
					required
					placeholder="products/example.webp"
					pattern="products/[a-z0-9][a-z0-9-]*\.webp"
				/></label
			>
			<label class="checkbox"
				><input name="isActive" type="checkbox" checked />ショップに公開する</label
			>
		</div>
		<div class="actions">
			<button type="button" class="secondary" onclick={() => (createOpen = false)}>キャンセル</button>
			<button type="submit">商品を登録</button>
		</div>
	</form>
</Modal>

<Modal bind:open={editOpen} title="商品を編集">
	{#if editing}
		{#key editing.id}
			<form method="POST" action="?/update">
				<input name="id" type="hidden" value={editing.id} />
				<div class="form-grid">
					<label>商品名<input name="name" value={editing.name} required maxlength="100" /></label>
					<label
						>カテゴリ<select name="category" value={editing.category}
							><option value="desk">デスク</option><option value="stationery">文房具</option><option
								value="accessory">アクセサリー</option
							></select
						></label
					>
					<label class="wide"
						>説明<textarea name="description" required maxlength="500">{editing.description}</textarea
						></label
					>
					<label
						>価格（円）<input
							name="price"
							type="number"
							min="0"
							value={editing.price}
							required
						/></label
					>
					<label
						>在庫数<input name="stock" type="number" min="0" value={editing.stock} required /></label
					>
					<label class="wide"
						>画像キー<input
							name="imageKey"
							value={editing.imageKey}
							required
							pattern="products/[a-z0-9][a-z0-9-]*\.webp"
						/></label
					>
					<label class="checkbox"
						><input name="isActive" type="checkbox" checked={editing.isActive} />ショップに公開する</label
					>
				</div>
				<div class="actions">
					<button type="button" class="secondary" onclick={() => (editOpen = false)}>キャンセル</button>
					<button type="submit">変更を保存</button>
				</div>
			</form>
		{/key}
	{/if}
</Modal>

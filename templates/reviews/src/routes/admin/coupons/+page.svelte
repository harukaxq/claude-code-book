<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	let { data, form } = $props();
	const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`;

	type Coupon = (typeof data.coupons)[number];
	let createOpen = $state(false);
	let editing = $state<Coupon | null>(null);
	let editOpen = $state(false);
	const discountText = (coupon: Coupon) =>
		coupon.discountType === 'fixed' ? yen(coupon.discountValue) : `${coupon.discountValue}%`;

	function openEdit(coupon: Coupon) {
		editing = coupon;
		editOpen = true;
	}
</script>

<svelte:head><title>クーポン管理 | TinyCommerce</title></svelte:head>
<div class="page">
	<header class="page-header row">
		<div>
			<p class="eyebrow">Admin</p>
			<h1>クーポン管理</h1>
			<p class="lead">固定額・パーセントクーポンの条件と利用状態を管理します。</p>
		</div>
		<button onclick={() => (createOpen = true)}>クーポンを追加</button>
	</header>
	{#if form?.message}<p class:success={form.success} class:error={!form.success}>
			{form.message}
		</p>{/if}

	<section class="panel">
		<h2>登録済みのクーポン（{data.coupons.length}件）</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>クーポンコード</th>
						<th>種類</th>
						<th class="num">割引</th>
						<th class="num">最低購入金額</th>
						<th>状態</th>
						<th class="num"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.coupons as coupon (coupon.id)}
						<tr>
							<td class="strong">{coupon.code}</td>
							<td>{coupon.discountType === 'fixed' ? '固定額' : 'パーセント'}</td>
							<td class="num">{discountText(coupon)}</td>
							<td class="num">{yen(coupon.minimumSubtotal)}</td>
							<td
								><span class="status" class:on={coupon.isActive}
									>{coupon.isActive ? '有効' : '無効'}</span
								></td
							>
							<td class="num"
								><button class="secondary small" onclick={() => openEdit(coupon)}>編集</button></td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>

<Modal bind:open={createOpen} title="新しいクーポンを登録">
	<form method="POST" action="?/create">
		<div class="form-grid">
			<label
				>クーポンコード<input name="code" required maxlength="50" placeholder="WELCOME500" /></label
			>
			<label
				>割引の種類<select name="discountType"><option value="fixed">固定額</option><option
						value="percentage">パーセント</option
					></select></label
			>
			<label>割引値（円または%）<input name="discountValue" type="number" min="1" required /></label>
			<label
				>最低購入金額（円）<input
					name="minimumSubtotal"
					type="number"
					min="0"
					value="0"
					required
				/></label
			>
			<label class="checkbox"><input name="isActive" type="checkbox" checked />有効にする</label>
		</div>
		<div class="actions">
			<button type="button" class="secondary" onclick={() => (createOpen = false)}>キャンセル</button>
			<button type="submit">クーポンを登録</button>
		</div>
	</form>
</Modal>

<Modal bind:open={editOpen} title="クーポンを編集">
	{#if editing}
		{#key editing.id}
			<form method="POST" action="?/update">
				<input name="id" type="hidden" value={editing.id} />
				<div class="form-grid">
					<label
						>クーポンコード<input name="code" value={editing.code} required maxlength="50" /></label
					>
					<label
						>割引の種類<select name="discountType" value={editing.discountType}><option
								value="fixed">固定額</option
							><option value="percentage">パーセント</option></select
						></label
					>
					<label
						>割引値（円または%）<input
							name="discountValue"
							type="number"
							min="1"
							value={editing.discountValue}
							required
						/></label
					>
					<label
						>最低購入金額（円）<input
							name="minimumSubtotal"
							type="number"
							min="0"
							value={editing.minimumSubtotal}
							required
						/></label
					>
					<label class="checkbox"
						><input name="isActive" type="checkbox" checked={editing.isActive} />有効にする</label
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

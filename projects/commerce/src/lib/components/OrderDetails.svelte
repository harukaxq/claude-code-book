<script lang="ts">
	type Order = {
		id: string;
		createdAt: Date | string;
		subtotal: number;
		couponDiscount: number;
		shippingFee: number;
		total: number;
		couponCode: string | null;
		items: Array<{
			id: string;
			productName: string;
			unitPrice: number;
			quantity: number;
			lineSubtotal: number;
		}>;
	};

	let { order }: { order: Order } = $props();
	const yen = (amount: number) => `${amount.toLocaleString('ja-JP')}円`;
	const dateTime = (value: Date | string) =>
		new Date(value).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<div class="order-meta">
	<div><span>注文番号</span><strong>{order.id}</strong></div>
	<div><span>注文日時</span><strong>{dateTime(order.createdAt)}</strong></div>
</div>

<div class="table-wrap">
	<table>
		<thead>
			<tr><th>商品</th><th>単価</th><th>数量</th><th>小計</th></tr>
		</thead>
		<tbody>
			{#each order.items as item (item.id)}
				<tr>
					<td>{item.productName}</td>
					<td>{yen(item.unitPrice)}</td>
					<td>{item.quantity}</td>
					<td>{yen(item.lineSubtotal)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<dl class="totals">
	<div>
		<dt>商品小計</dt>
		<dd>{yen(order.subtotal)}</dd>
	</div>
	<div>
		<dt>クーポン{order.couponCode ? `（${order.couponCode}）` : ''}</dt>
		<dd>− {yen(order.couponDiscount)}</dd>
	</div>
	<div>
		<dt>送料</dt>
		<dd>{order.shippingFee === 0 ? '無料' : yen(order.shippingFee)}</dd>
	</div>
	<div class="total">
		<dt>支払合計</dt>
		<dd>{yen(order.total)}</dd>
	</div>
</dl>

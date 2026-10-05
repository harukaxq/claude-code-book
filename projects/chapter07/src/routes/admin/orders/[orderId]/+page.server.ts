import { error } from '@sveltejs/kit';
import { getOrder } from '$lib/server/services/orders';

export async function load({ params }) {
	const order = await getOrder(params.orderId);
	if (!order) error(404, '注文が見つかりません。');
	return { order };
}

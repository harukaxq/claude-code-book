import { listOrders } from '$lib/server/services/orders';

export async function load() {
	return { orders: await listOrders() };
}

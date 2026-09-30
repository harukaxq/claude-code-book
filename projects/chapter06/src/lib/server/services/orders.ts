import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItems, orders } from '$lib/server/db/schema';

export async function listOrders() {
	const orderRows = db.select().from(orders).orderBy(desc(orders.createdAt)).all();
	const itemRows = db.select().from(orderItems).all();
	return orderRows.map((order) => ({
		...order,
		itemCount: itemRows
			.filter((item) => item.orderId === order.id)
			.reduce((count, item) => count + item.quantity, 0)
	}));
}

export async function getOrder(orderId: string) {
	const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
	if (!order) return null;
	const items = db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();
	return { ...order, items };
}

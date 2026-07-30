import { randomUUID } from 'node:crypto';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';

export type Product = typeof products.$inferSelect;

export type ProductInput = {
	name: string;
	description: string;
	imageKey: string;
	category: 'desk' | 'stationery' | 'accessory';
	price: number;
	stock: number;
	isActive: boolean;
};

export async function listActiveProducts(): Promise<Product[]> {
	return db
		.select()
		.from(products)
		.where(eq(products.isActive, true))
		.orderBy(asc(products.createdAt))
		.all();
}

export async function getActiveProduct(productId: string): Promise<Product | null> {
	return (
		db
			.select()
			.from(products)
			.where(and(eq(products.id, productId), eq(products.isActive, true)))
			.get() ?? null
	);
}

export async function listProducts(): Promise<Product[]> {
	return db.select().from(products).orderBy(asc(products.createdAt)).all();
}

export async function createProduct(input: ProductInput): Promise<{ id: string }> {
	const id = `product-${randomUUID()}`;
	const now = new Date();
	db.insert(products)
		.values({ id, ...input, createdAt: now, updatedAt: now })
		.run();
	return { id };
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
	const result = db
		.update(products)
		.set({ ...input, updatedAt: new Date() })
		.where(eq(products.id, id))
		.run();
	if (result.changes === 0) throw new Error('商品が見つかりません。');
}

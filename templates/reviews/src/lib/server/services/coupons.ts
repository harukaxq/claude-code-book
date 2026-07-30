import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { coupons } from '$lib/server/db/schema';

export type Coupon = typeof coupons.$inferSelect;

export type CouponInput = {
	code: string;
	discountType: 'fixed' | 'percentage';
	discountValue: number;
	minimumSubtotal: number;
	isActive: boolean;
};

export async function listCoupons(): Promise<Coupon[]> {
	return db.select().from(coupons).orderBy(asc(coupons.createdAt)).all();
}

export async function createCoupon(input: CouponInput): Promise<{ id: string }> {
	const id = `coupon-${randomUUID()}`;
	const now = new Date();
	db.insert(coupons)
		.values({ id, ...input, createdAt: now, updatedAt: now })
		.run();
	return { id };
}

export async function updateCoupon(id: string, input: CouponInput): Promise<void> {
	const result = db
		.update(coupons)
		.set({ ...input, updatedAt: new Date() })
		.where(eq(coupons.id, id))
		.run();
	if (result.changes === 0) throw new Error('クーポンが見つかりません。');
}

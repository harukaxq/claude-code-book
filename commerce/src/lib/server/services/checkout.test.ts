import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '$lib/server/db';
import { coupons, orderItems, orders, products } from '$lib/server/db/schema';
import { calculateCart, calculateTotals, CheckoutError, placeOrder } from './checkout';

const now = new Date('2026-01-01T00:00:00.000Z');

beforeAll(() => migrate(db, { migrationsFolder: './drizzle' }));

beforeEach(() => {
	db.delete(orderItems).run();
	db.delete(orders).run();
	db.delete(coupons).run();
	db.delete(products).run();
	db.insert(products)
		.values([
			{
				id: 'desk-mat',
				name: 'デスクマット',
				description: 'test',
				imageKey: 'products/desk-mat.webp',
				category: 'desk',
				price: 3000,
				stock: 5,
				isActive: true,
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'hidden',
				name: '非公開商品',
				description: 'test',
				imageKey: 'products/hidden.webp',
				category: 'desk',
				price: 1000,
				stock: 5,
				isActive: false,
				createdAt: now,
				updatedAt: now
			}
		])
		.run();
	db.insert(coupons)
		.values([
			{
				id: 'welcome',
				code: 'WELCOME500',
				discountAmount: 500,
				minimumSubtotal: 3000,
				isActive: true,
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'old',
				code: 'OLD500',
				discountAmount: 500,
				minimumSubtotal: 0,
				isActive: false,
				createdAt: now,
				updatedAt: now
			}
		])
		.run();
});

describe('calculateTotals', () => {
	test('固定額クーポンを商品小計へ適用して送料を加算する', () => {
		const summary = calculateTotals(
			[{ productId: 'p1', productName: '商品', unitPrice: 3000, quantity: 1 }],
			{ code: 'WELCOME500', discountAmount: 500, minimumSubtotal: 3000, isActive: true }
		);
		expect(summary).toMatchObject({
			subtotal: 3000,
			couponDiscount: 500,
			shippingFee: 500,
			total: 3000
		});
	});

	test('5,000円以上では送料を無料にする', () => {
		const summary = calculateTotals(
			[{ productId: 'p1', productName: '商品', unitPrice: 3000, quantity: 2 }],
			null
		);
		expect(summary).toMatchObject({
			subtotal: 6000,
			couponDiscount: 0,
			shippingFee: 0,
			total: 6000
		});
	});

	test('最低購入金額未満と無効クーポンは警告にする', () => {
		const item = [{ productId: 'p1', productName: '商品', unitPrice: 1000, quantity: 1 }];
		expect(
			calculateTotals(item, {
				code: 'HIGH',
				discountAmount: 500,
				minimumSubtotal: 3000,
				isActive: true
			}).warnings
		).toHaveLength(1);
		expect(
			calculateTotals(item, {
				code: 'OLD',
				discountAmount: 500,
				minimumSubtotal: 0,
				isActive: false
			}).warnings
		).toHaveLength(1);
	});
});

describe('checkout service', () => {
	test('金額計算と注文確定で同じ金額になり、在庫を減らす', async () => {
		const calculated = await calculateCart([{ productId: 'desk-mat', quantity: 1 }], 'WELCOME500');
		const { orderId } = await placeOrder(
			'demo',
			[{ productId: 'desk-mat', quantity: 1 }],
			'WELCOME500',
			now
		);
		const saved = db.select().from(orders).where(eq(orders.id, orderId)).get();
		const product = db.select().from(products).where(eq(products.id, 'desk-mat')).get();
		expect(saved).toMatchObject({
			subtotal: calculated.subtotal,
			couponDiscount: calculated.couponDiscount,
			shippingFee: calculated.shippingFee,
			total: calculated.total
		});
		expect(product?.stock).toBe(4);
	});

	test.each([0, 11, 1.5])('数量%sを拒否する', async (quantity) => {
		await expect(
			placeOrder('demo', [{ productId: 'desk-mat', quantity }], null, now)
		).rejects.toMatchObject({ code: 'INVALID_CART' });
	});

	test('在庫不足と非公開商品を拒否し、注文や在庫を変更しない', async () => {
		await expect(
			placeOrder('demo', [{ productId: 'desk-mat', quantity: 6 }], null, now)
		).rejects.toBeInstanceOf(CheckoutError);
		await expect(
			placeOrder('demo', [{ productId: 'hidden', quantity: 1 }], null, now)
		).rejects.toBeInstanceOf(CheckoutError);
		expect(db.select().from(orders).all()).toHaveLength(0);
		expect(db.select().from(products).where(eq(products.id, 'desk-mat')).get()?.stock).toBe(5);
	});
});

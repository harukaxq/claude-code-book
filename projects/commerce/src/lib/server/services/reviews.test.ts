import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '$lib/server/db';
import { orderItems, orders, products, reviews } from '$lib/server/db/schema';
import { createReview, getProductReviews, getReviewEligibility, ReviewError } from './reviews';

const now = new Date('2026-01-01T00:00:00.000Z');

beforeAll(() => migrate(db, { migrationsFolder: './drizzle' }));

beforeEach(() => {
	db.delete(reviews).run();
	db.delete(orderItems).run();
	db.delete(orders).run();
	db.delete(products).run();
	db.insert(products)
		.values({
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
		})
		.run();
	db.insert(orders)
		.values([
			{
				id: 'order-1',
				customerId: 'demo-customer',
				subtotal: 3000,
				couponDiscount: 0,
				shippingFee: 500,
				total: 3500,
				couponCode: null,
				createdAt: now
			},
			{
				id: 'order-2',
				customerId: 'another-customer',
				subtotal: 3000,
				couponDiscount: 0,
				shippingFee: 500,
				total: 3500,
				couponCode: null,
				createdAt: now
			}
		])
		.run();
	db.insert(orderItems)
		.values([
			{
				id: 'order-item-1',
				orderId: 'order-1',
				productId: 'desk-mat',
				productName: 'デスクマット',
				unitPrice: 3000,
				quantity: 1,
				lineSubtotal: 3000
			},
			{
				id: 'order-item-2',
				orderId: 'order-2',
				productId: 'desk-mat',
				productName: 'デスクマット',
				unitPrice: 3000,
				quantity: 1,
				lineSubtotal: 3000
			}
		])
		.run();
});

describe('review service', () => {
	test('購入済み商品へレビューを投稿し、平均評価と件数へ反映する', async () => {
		await createReview('demo-customer', 'desk-mat', 4, '使いやすいです。', now);
		await createReview(
			'another-customer',
			'desk-mat',
			2,
			'少し大きかったです。',
			new Date('2026-01-01T00:00:01.000Z')
		);

		const overview = await getProductReviews('desk-mat');
		expect(overview.reviewCount).toBe(2);
		expect(overview.averageRating).toBe(3);
		expect(overview.reviews.map((review) => review.rating)).toEqual([2, 4]);
	});

	test('購入していない商品への投稿を拒否する', async () => {
		await expect(
			createReview('not-purchased', 'desk-mat', 5, '気に入りました。', now)
		).rejects.toMatchObject({ code: 'NOT_PURCHASED' });
	});

	test('同じ購入者による同じ商品への2件目の投稿を拒否する', async () => {
		await createReview('demo-customer', 'desk-mat', 5, '気に入りました。', now);
		await expect(
			createReview('demo-customer', 'desk-mat', 4, '追記です。', now)
		).rejects.toMatchObject({ code: 'ALREADY_REVIEWED' });
	});

	test('購入状態と投稿状態に応じたレビュー可否を返す', async () => {
		await expect(getReviewEligibility('not-purchased', 'desk-mat')).resolves.toBe('not-purchased');
		await expect(getReviewEligibility('demo-customer', 'desk-mat')).resolves.toBe('can-review');
		await createReview('demo-customer', 'desk-mat', 5, '気に入りました。', now);
		await expect(getReviewEligibility('demo-customer', 'desk-mat')).resolves.toBe(
			'already-reviewed'
		);
	});

	test.each([
		{ rating: 0, comment: 'コメント' },
		{ rating: 6, comment: 'コメント' },
		{ rating: 4, comment: '' },
		{ rating: 4, comment: 'あ'.repeat(201) }
	])('不正な評価またはコメントを拒否する: $rating', async ({ rating, comment }) => {
		await expect(
			createReview('demo-customer', 'desk-mat', rating, comment, now)
		).rejects.toBeInstanceOf(ReviewError);
	});
});

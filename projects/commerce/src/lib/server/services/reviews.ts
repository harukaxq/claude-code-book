import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItems, orders, products, reviews } from '$lib/server/db/schema';

export type ReviewErrorCode =
	'INVALID_REVIEW' | 'PRODUCT_UNAVAILABLE' | 'NOT_PURCHASED' | 'ALREADY_REVIEWED';

export class ReviewError extends Error {
	constructor(
		public readonly code: ReviewErrorCode,
		message: string
	) {
		super(message);
		this.name = 'ReviewError';
	}
}

export async function getProductReviews(productId: string): Promise<{
	reviews: Array<typeof reviews.$inferSelect>;
	averageRating: number | null;
	reviewCount: number;
}> {
	const rows = db
		.select()
		.from(reviews)
		.where(eq(reviews.productId, productId))
		.orderBy(desc(reviews.createdAt), desc(reviews.id))
		.all();
	const averageRating =
		rows.length === 0 ? null : rows.reduce((sum, review) => sum + review.rating, 0) / rows.length;
	return { reviews: rows, averageRating, reviewCount: rows.length };
}

export async function getReviewEligibility(
	customerId: string,
	productId: string
): Promise<'can-review' | 'not-purchased' | 'already-reviewed'> {
	const purchase = db
		.select({ id: orderItems.id })
		.from(orderItems)
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.where(and(eq(orders.customerId, customerId), eq(orderItems.productId, productId)))
		.get();
	if (!purchase) return 'not-purchased';
	const existing = db
		.select({ id: reviews.id })
		.from(reviews)
		.where(and(eq(reviews.customerId, customerId), eq(reviews.productId, productId)))
		.get();
	return existing === undefined ? 'can-review' : 'already-reviewed';
}

export async function createReview(
	customerId: string,
	productId: string,
	rating: number,
	comment: string,
	createdAt: Date
): Promise<{ id: string }> {
	const normalizedComment = comment.trim();
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		throw new ReviewError('INVALID_REVIEW', '評価は1から5までの整数で指定してください。');
	}
	if (normalizedComment.length < 1 || normalizedComment.length > 200) {
		throw new ReviewError('INVALID_REVIEW', 'コメントは1文字以上200文字以下で入力してください。');
	}

	const product = db
		.select({ id: products.id })
		.from(products)
		.where(and(eq(products.id, productId), eq(products.isActive, true)))
		.get();
	if (!product) {
		throw new ReviewError('PRODUCT_UNAVAILABLE', 'レビュー対象の商品が見つかりません。');
	}

	const purchase = db
		.select({ id: orderItems.id })
		.from(orderItems)
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.where(and(eq(orders.customerId, customerId), eq(orderItems.productId, productId)))
		.get();
	if (!purchase) {
		throw new ReviewError('NOT_PURCHASED', '購入した商品だけレビューできます。');
	}

	const existing = db
		.select({ id: reviews.id })
		.from(reviews)
		.where(and(eq(reviews.customerId, customerId), eq(reviews.productId, productId)))
		.get();
	if (existing) {
		throw new ReviewError('ALREADY_REVIEWED', 'この商品にはすでにレビューを投稿しています。');
	}

	const id = `review-${randomUUID()}`;
	try {
		db.insert(reviews)
			.values({ id, productId, customerId, rating, comment: normalizedComment, createdAt })
			.run();
	} catch (error) {
		if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
			throw new ReviewError('ALREADY_REVIEWED', 'この商品にはすでにレビューを投稿しています。');
		}
		throw error;
	}
	return { id };
}

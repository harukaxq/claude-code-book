import { randomUUID } from 'node:crypto';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { coupons, orderItems, orders, products } from '$lib/server/db/schema';

export type CartItem = {
	productId: string;
	quantity: number;
};

export type CartProduct = {
	productId: string;
	productName: string;
	unitPrice: number;
	quantity: number;
};

export type CouponForCalculation = {
	code: string;
	discountType: 'fixed' | 'percentage';
	discountValue: number;
	minimumSubtotal: number;
	isActive: boolean;
};

export type CartSummaryItem = CartProduct & {
	lineSubtotal: number;
};

export type CartSummary = {
	items: CartSummaryItem[];
	subtotal: number;
	couponDiscount: number;
	shippingFee: number;
	total: number;
	appliedCoupon: { code: string; discountAmount: number } | null;
	warnings: string[];
};

export type CheckoutErrorCode = 'INVALID_CART' | 'PRODUCT_UNAVAILABLE' | 'INSUFFICIENT_STOCK';

export class CheckoutError extends Error {
	constructor(
		public readonly code: CheckoutErrorCode,
		message: string
	) {
		super(message);
		this.name = 'CheckoutError';
	}
}

export function calculateTotals(
	items: CartProduct[],
	coupon: CouponForCalculation | null
): CartSummary {
	const summaryItems = items.map((item) => ({
		...item,
		lineSubtotal: item.unitPrice * item.quantity
	}));
	const subtotal = summaryItems.reduce((sum, item) => sum + item.lineSubtotal, 0);
	let couponDiscount = 0;
	let appliedCoupon: CartSummary['appliedCoupon'] = null;
	const warnings: string[] = [];

	if (coupon) {
		if (!coupon.isActive) {
			warnings.push(`クーポン「${coupon.code}」は現在利用できません。`);
		} else if (subtotal < coupon.minimumSubtotal) {
			warnings.push(
				`クーポン「${coupon.code}」は商品小計${coupon.minimumSubtotal.toLocaleString('ja-JP')}円以上で利用できます。`
			);
		} else {
			const calculatedDiscount =
				coupon.discountType === 'fixed'
					? coupon.discountValue
					: Math.floor((subtotal * coupon.discountValue) / 100);
			couponDiscount = Math.min(calculatedDiscount, subtotal);
			appliedCoupon = { code: coupon.code, discountAmount: couponDiscount };
		}
	}

	const shippingFee = subtotal === 0 || subtotal >= 5000 ? 0 : 500;
	return {
		items: summaryItems,
		subtotal,
		couponDiscount,
		shippingFee,
		total: subtotal - couponDiscount + shippingFee,
		appliedCoupon,
		warnings
	};
}

function assertValidItems(items: CartItem[]): void {
	if (items.length === 0) throw new CheckoutError('INVALID_CART', 'カートに商品がありません。');
	if (new Set(items.map((item) => item.productId)).size !== items.length) {
		throw new CheckoutError('INVALID_CART', '同じ商品を複数の明細に分けることはできません。');
	}
	for (const item of items) {
		if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
			throw new CheckoutError('INVALID_CART', '数量は1から10までの整数で指定してください。');
		}
	}
}

function loadCart(
	query: Pick<typeof db, 'select'>,
	items: CartItem[],
	couponCode: string | null,
	requireStock: boolean
): {
	cartProducts: CartProduct[];
	coupon: CouponForCalculation | null;
	couponWasRequested: boolean;
} {
	assertValidItems(items);
	const rows = query
		.select()
		.from(products)
		.where(
			inArray(
				products.id,
				items.map((item) => item.productId)
			)
		)
		.all();
	const productsById = new Map(rows.map((product) => [product.id, product]));
	const cartProducts = items.map((item) => {
		const product = productsById.get(item.productId);
		if (!product || !product.isActive) {
			throw new CheckoutError('PRODUCT_UNAVAILABLE', '購入できない商品がカートに含まれています。');
		}
		if (requireStock && product.stock < item.quantity) {
			throw new CheckoutError('INSUFFICIENT_STOCK', `${product.name}の在庫が不足しています。`);
		}
		return {
			productId: product.id,
			productName: product.name,
			unitPrice: product.price,
			quantity: item.quantity
		};
	});
	const normalizedCode = couponCode?.trim().toUpperCase() || null;
	const coupon = normalizedCode
		? (query.select().from(coupons).where(eq(coupons.code, normalizedCode)).get() ?? null)
		: null;
	return { cartProducts, coupon, couponWasRequested: normalizedCode !== null };
}

function withUnknownCouponWarning(
	summary: CartSummary,
	coupon: CouponForCalculation | null,
	couponWasRequested: boolean
): CartSummary {
	if (couponWasRequested && coupon === null) {
		return { ...summary, warnings: ['入力されたクーポンコードは見つかりません。'] };
	}
	return summary;
}

export async function calculateCart(
	items: CartItem[],
	couponCode: string | null
): Promise<CartSummary> {
	const loaded = loadCart(db, items, couponCode, false);
	return withUnknownCouponWarning(
		calculateTotals(loaded.cartProducts, loaded.coupon),
		loaded.coupon,
		loaded.couponWasRequested
	);
}

export async function placeOrder(
	customerId: string,
	items: CartItem[],
	couponCode: string | null,
	orderedAt: Date
): Promise<{ orderId: string }> {
	const orderId = `order-${randomUUID()}`;

	return db.transaction((tx) => {
		const loaded = loadCart(tx, items, couponCode, true);
		const summary = withUnknownCouponWarning(
			calculateTotals(loaded.cartProducts, loaded.coupon),
			loaded.coupon,
			loaded.couponWasRequested
		);

		tx.insert(orders)
			.values({
				id: orderId,
				customerId,
				subtotal: summary.subtotal,
				couponDiscount: summary.couponDiscount,
				shippingFee: summary.shippingFee,
				total: summary.total,
				couponCode: summary.appliedCoupon?.code ?? null,
				createdAt: orderedAt
			})
			.run();

		for (const item of summary.items) {
			tx.insert(orderItems)
				.values({
					id: `order-item-${randomUUID()}`,
					orderId,
					productId: item.productId,
					productName: item.productName,
					unitPrice: item.unitPrice,
					quantity: item.quantity,
					lineSubtotal: item.lineSubtotal
				})
				.run();
			tx.update(products)
				.set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: orderedAt })
				.where(eq(products.id, item.productId))
				.run();
		}

		return { orderId };
	});
}

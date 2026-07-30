import { getContext, setContext } from 'svelte';

export type CartItem = {
	productId: string;
	quantity: number;
};

export type CartSummary = {
	items: Array<{
		productId: string;
		productName: string;
		unitPrice: number;
		quantity: number;
		lineSubtotal: number;
	}>;
	subtotal: number;
	couponDiscount: number;
	shippingFee: number;
	total: number;
	appliedCoupon: { code: string; discountAmount: number } | null;
	warnings: string[];
};

const storageKey = 'tiny-commerce.cart.v1';
const emptySummary = (): CartSummary => ({
	items: [],
	subtotal: 0,
	couponDiscount: 0,
	shippingFee: 0,
	total: 0,
	appliedCoupon: null,
	warnings: []
});

function isCartItem(value: unknown): value is CartItem {
	if (typeof value !== 'object' || value === null) return false;
	const item = value as Record<string, unknown>;
	return (
		typeof item.productId === 'string' &&
		Number.isInteger(item.quantity) &&
		Number(item.quantity) >= 1 &&
		Number(item.quantity) <= 10
	);
}

export class CartState {
	items = $state<CartItem[]>([]);
	couponCode = $state<string | null>(null);
	summary = $state<CartSummary>(emptySummary());
	isCalculating = $state(false);
	error = $state<string | null>(null);
	initialized = $state(false);

	get itemCount(): number {
		return this.items.reduce((count, item) => count + item.quantity, 0);
	}

	initialize(): void {
		if (this.initialized || typeof localStorage === 'undefined') return;
		this.initialized = true;
		try {
			const raw = localStorage.getItem(storageKey);
			if (!raw) return;
			const stored = JSON.parse(raw) as Record<string, unknown>;
			if (
				stored.version !== 1 ||
				!Array.isArray(stored.items) ||
				!stored.items.every(isCartItem) ||
				!(stored.couponCode === null || typeof stored.couponCode === 'string')
			) {
				throw new Error('invalid cart');
			}
			const items = stored.items as CartItem[];
			if (
				items.some(
					(item, index) => items.findIndex((other) => other.productId === item.productId) !== index
				)
			) {
				throw new Error('duplicate product');
			}
			this.items = items;
			this.couponCode = stored.couponCode as string | null;
			void this.calculate();
		} catch {
			this.items = [];
			this.couponCode = null;
			localStorage.removeItem(storageKey);
		}
	}

	private save(): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(
			storageKey,
			JSON.stringify({ version: 1, items: this.items, couponCode: this.couponCode })
		);
	}

	add(productId: string): void {
		const existing = this.items.find((item) => item.productId === productId);
		if (existing) existing.quantity = Math.min(existing.quantity + 1, 10);
		else this.items.push({ productId, quantity: 1 });
		this.save();
	}

	remove(productId: string): void {
		this.items = this.items.filter((item) => item.productId !== productId);
		this.save();
	}

	setQuantity(productId: string, quantity: number): void {
		const item = this.items.find((candidate) => candidate.productId === productId);
		if (!item || !Number.isInteger(quantity)) return;
		item.quantity = Math.max(1, Math.min(10, quantity));
		this.save();
	}

	setCouponCode(code: string): void {
		this.couponCode = code.trim().toUpperCase() || null;
		this.save();
	}

	async calculate(): Promise<void> {
		if (this.items.length === 0) {
			this.summary = emptySummary();
			this.error = null;
			return;
		}
		this.isCalculating = true;
		this.error = null;
		try {
			const response = await fetch('/api/cart/calculate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ items: this.items, couponCode: this.couponCode ?? undefined })
			});
			const body = (await response.json()) as CartSummary | { message?: string };
			if (!response.ok) {
				throw new Error(
					'message' in body && body.message ? body.message : '金額を計算できませんでした。'
				);
			}
			this.summary = body as CartSummary;
		} catch (error) {
			this.error = error instanceof Error ? error.message : '金額を計算できませんでした。';
		} finally {
			this.isCalculating = false;
		}
	}

	clear(): void {
		this.items = [];
		this.couponCode = null;
		this.summary = emptySummary();
		this.error = null;
		this.save();
	}
}

const cartContextKey = Symbol('tiny-commerce-cart');

export function provideCart(): CartState {
	return setContext(cartContextKey, new CartState());
}

export function useCart(): CartState {
	return getContext<CartState>(cartContextKey);
}

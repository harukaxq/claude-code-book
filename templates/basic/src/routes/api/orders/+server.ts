import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { CheckoutError, placeOrder } from '$lib/server/services/checkout';
import type { RequestHandler } from './$types';

const requestSchema = z.object({
	items: z
		.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(10) }))
		.min(1)
		.refine((items) => new Set(items.map((item) => item.productId)).size === items.length, {
			message: '同じ商品を複数指定できません。'
		}),
	couponCode: z.string().max(50).optional()
});

export const POST: RequestHandler = async ({ request }) => {
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return json({ message: 'JSON形式のリクエストを送信してください。' }, { status: 400 });
	}
	const parsed = requestSchema.safeParse(input);
	if (!parsed.success) return json({ message: parsed.error.issues[0].message }, { status: 400 });

	try {
		return json(
			await placeOrder(
				'demo-customer',
				parsed.data.items,
				parsed.data.couponCode ?? null,
				new Date()
			),
			{ status: 201 }
		);
	} catch (error) {
		if (error instanceof CheckoutError) {
			const status = error.code === 'INVALID_CART' ? 400 : 409;
			return json({ message: error.message }, { status });
		}
		console.error(error);
		return json({ message: '注文を確定できませんでした。' }, { status: 500 });
	}
};

import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { createCoupon, listCoupons, updateCoupon } from '$lib/server/services/coupons';

const couponSchema = z
	.object({
		code: z
			.string()
			.trim()
			.toUpperCase()
			.regex(/^[A-Z0-9_-]{1,50}$/, 'コードは半角英数字で入力してください。'),
		discountType: z.enum(['fixed', 'percentage']),
		discountValue: z.number().int().positive('割引値は1以上にしてください。'),
		minimumSubtotal: z.number().int().min(0, '最低購入金額は0以上にしてください。'),
		isActive: z.boolean()
	})
	.superRefine((coupon, context) => {
		if (coupon.discountType === 'percentage' && coupon.discountValue > 100) {
			context.addIssue({
				code: 'custom',
				path: ['discountValue'],
				message: '割引率は100%以下にしてください。'
			});
		}
	});

function readCoupon(formData: FormData) {
	return couponSchema.safeParse({
		code: formData.get('code'),
		discountType: formData.get('discountType'),
		discountValue: Number(formData.get('discountValue')),
		minimumSubtotal: Number(formData.get('minimumSubtotal')),
		isActive: formData.get('isActive') === 'on'
	});
}

export async function load() {
	return { coupons: await listCoupons() };
}

export const actions = {
	create: async ({ request }) => {
		const parsed = readCoupon(await request.formData());
		if (!parsed.success) return fail(400, { message: parsed.error.issues[0].message });
		try {
			await createCoupon(parsed.data);
			return { success: true, message: 'クーポンを登録しました。' };
		} catch (error) {
			console.error(error);
			return fail(400, { message: '同じコードのクーポンがないか確認してください。' });
		}
	},
	update: async ({ request }) => {
		const formData = await request.formData();
		const id = z.string().min(1).safeParse(formData.get('id'));
		const parsed = readCoupon(formData);
		if (!id.success || !parsed.success) {
			return fail(400, {
				message: parsed.success ? 'クーポンIDが不正です。' : parsed.error.issues[0].message
			});
		}
		try {
			await updateCoupon(id.data, parsed.data);
			return { success: true, message: 'クーポンを更新しました。' };
		} catch (error) {
			console.error(error);
			return fail(400, { message: '同じコードのクーポンがないか確認してください。' });
		}
	}
};

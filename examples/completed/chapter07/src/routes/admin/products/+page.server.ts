import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { createProduct, listProducts, updateProduct } from '$lib/server/services/products';

const productSchema = z.object({
	name: z.string().trim().min(1, '商品名を入力してください。').max(100),
	description: z.string().trim().min(1, '説明を入力してください。').max(500),
	imageKey: z
		.string()
		.trim()
		.regex(/^products\/[a-z0-9][a-z0-9-]*\.webp$/, '画像キーの形式が不正です。'),
	category: z.enum(['desk', 'stationery', 'accessory']),
	price: z.number().int().min(0, '価格は0以上にしてください。'),
	stock: z.number().int().min(0, '在庫は0以上にしてください。'),
	isActive: z.boolean()
});

function readProduct(formData: FormData) {
	return productSchema.safeParse({
		name: formData.get('name'),
		description: formData.get('description'),
		imageKey: formData.get('imageKey'),
		category: formData.get('category'),
		price: Number(formData.get('price')),
		stock: Number(formData.get('stock')),
		isActive: formData.get('isActive') === 'on'
	});
}

export async function load() {
	return { products: await listProducts() };
}

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const parsed = readProduct(formData);
		if (!parsed.success) return fail(400, { message: parsed.error.issues[0].message });
		try {
			await createProduct(parsed.data);
			return { success: true, message: '商品を登録しました。' };
		} catch (error) {
			console.error(error);
			return fail(400, { message: '商品を登録できませんでした。' });
		}
	},
	update: async ({ request }) => {
		const formData = await request.formData();
		const id = z.string().min(1).safeParse(formData.get('id'));
		const parsed = readProduct(formData);
		if (!id.success || !parsed.success) {
			return fail(400, {
				message: parsed.success ? '商品IDが不正です。' : parsed.error.issues[0].message
			});
		}
		try {
			await updateProduct(id.data, parsed.data);
			return { success: true, message: '商品を更新しました。' };
		} catch (error) {
			console.error(error);
			return fail(400, { message: '商品を更新できませんでした。' });
		}
	}
};

import { env } from '$env/dynamic/public';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';
import { getActiveProduct } from '$lib/server/services/products';
import {
	createReview,
	getProductReviews,
	getReviewEligibility,
	ReviewError
} from '$lib/server/services/reviews';
import type { Actions, PageServerLoad } from './$types';

const customerId = 'demo-customer';
const reviewSchema = z.object({
	rating: z.number().int().min(1).max(5),
	comment: z.string().trim().min(1, 'コメントを入力してください。').max(200)
});

export const load: PageServerLoad = async ({ params }) => {
	const product = await getActiveProduct(params.productId);
	if (!product) error(404, '商品が見つかりません。');
	const [reviewOverview, reviewEligibility] = await Promise.all([
		getProductReviews(product.id),
		getReviewEligibility(customerId, product.id)
	]);
	return {
		product,
		...reviewOverview,
		reviewEligibility,
		imageBaseUrl: env.PUBLIC_PRODUCT_IMAGE_BASE_URL ?? 'http://localhost:8333/tiny-commerce'
	};
};

export const actions: Actions = {
	review: async ({ params, request }) => {
		const formData = await request.formData();
		const parsed = reviewSchema.safeParse({
			rating: Number(formData.get('rating')),
			comment: formData.get('comment')
		});
		if (!parsed.success) return fail(400, { message: parsed.error.issues[0].message });
		try {
			await createReview(
				customerId,
				params.productId,
				parsed.data.rating,
				parsed.data.comment,
				new Date()
			);
			return { success: true, message: 'レビューを投稿しました。' };
		} catch (caught) {
			if (caught instanceof ReviewError) {
				const status =
					caught.code === 'INVALID_REVIEW' ? 400 : caught.code === 'NOT_PURCHASED' ? 403 : 409;
				return fail(status, { message: caught.message });
			}
			console.error(caught);
			return fail(500, { message: 'レビューを投稿できませんでした。' });
		}
	}
};

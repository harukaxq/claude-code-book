import { env } from '$env/dynamic/public';
import { listActiveProducts } from '$lib/server/services/products';

export async function load() {
	return {
		products: await listActiveProducts(),
		imageBaseUrl: env.PUBLIC_PRODUCT_IMAGE_BASE_URL ?? 'http://localhost:8333/tiny-commerce'
	};
}

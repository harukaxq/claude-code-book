import { CreateBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/lib/server/db';
import { coupons, products } from '../src/lib/server/db/schema';

const bucket = 'tiny-commerce';
const sampleDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../samples/products');
const now = new Date('2026-01-01T00:00:00.000Z');

const productSeeds = [
	{
		id: 'product-mini-notebook',
		name: 'ミニノート',
		description: 'ポケットに収まる、方眼タイプの小さなノートです。',
		imageKey: 'products/mini-notebook.webp',
		category: 'stationery' as const,
		price: 199,
		stock: 100,
		isActive: true,
		file: 'mini-notebook.webp'
	},
	{
		id: 'product-cable-holder',
		name: 'ケーブルホルダー',
		description: 'デスク上の充電ケーブルをすっきりまとめます。',
		imageKey: 'products/cable-holder.webp',
		category: 'accessory' as const,
		price: 680,
		stock: 30,
		isActive: true,
		file: 'cable-holder.webp'
	},
	{
		id: 'product-desk-mat',
		name: 'デスクマット',
		description: '手触りのよい、落ち着いた色の大型デスクマットです。',
		imageKey: 'products/desk-mat.webp',
		category: 'desk' as const,
		price: 2980,
		stock: 20,
		isActive: true,
		file: 'desk-mat.webp'
	},
	{
		id: 'product-mechanical-keyboard',
		name: 'メカニカルキーボード',
		description: '軽快な打鍵感を楽しめる、コンパクトなキーボードです。',
		imageKey: 'products/mechanical-keyboard.webp',
		category: 'desk' as const,
		price: 12800,
		stock: 10,
		isActive: true,
		file: 'mechanical-keyboard.webp'
	},
	{
		id: 'product-monitor-stand',
		name: 'モニタースタンド',
		description: '目線を上げて、デスク下にも収納を作れるスタンドです。',
		imageKey: 'products/monitor-stand.webp',
		category: 'desk' as const,
		price: 4800,
		stock: 0,
		isActive: true,
		file: 'monitor-stand.webp'
	}
];

const couponSeeds = [
	{
		id: 'coupon-welcome500',
		code: 'WELCOME500',
		discountType: 'fixed' as const,
		discountValue: 500,
		minimumSubtotal: 3000,
		isActive: true
	},
	{
		id: 'coupon-small100',
		code: 'SMALL100',
		discountType: 'fixed' as const,
		discountValue: 100,
		minimumSubtotal: 0,
		isActive: true
	},
	{
		id: 'coupon-tenoff',
		code: 'TENOFF',
		discountType: 'percentage' as const,
		discountValue: 10,
		minimumSubtotal: 0,
		isActive: true
	},
	{
		id: 'coupon-old500',
		code: 'OLD500',
		discountType: 'fixed' as const,
		discountValue: 500,
		minimumSubtotal: 0,
		isActive: false
	}
];

const missingFiles = productSeeds
	.map((product) => product.file)
	.filter((file) => !existsSync(resolve(sampleDirectory, file)));

if (missingFiles.length > 0) {
	console.error(`次の商品画像がありません: ${missingFiles.join(', ')}`);
	process.exit(1);
}

const s3 = new S3Client({
	endpoint: process.env.S3_ENDPOINT ?? 'http://127.0.0.1:8333',
	region: 'us-east-1',
	forcePathStyle: true,
	credentials: { accessKeyId: 'local', secretAccessKey: 'local' }
});

try {
	await s3.send(new CreateBucketCommand({ Bucket: bucket }));
} catch (error) {
	const name = error instanceof Error ? error.name : '';
	if (!['BucketAlreadyExists', 'BucketAlreadyOwnedByYou'].includes(name)) throw error;
}

for (const product of productSeeds) {
	const { file, ...values } = product;
	await db
		.insert(products)
		.values({ ...values, createdAt: now, updatedAt: now })
		.onConflictDoUpdate({
			target: products.id,
			set: { ...values, updatedAt: now }
		});

	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: values.imageKey,
			Body: await readFile(resolve(sampleDirectory, file)),
			ContentType: 'image/webp'
		})
	);
}

for (const coupon of couponSeeds) {
	const existing = await db
		.select({ id: coupons.id })
		.from(coupons)
		.where(eq(coupons.code, coupon.code))
		.get();
	if (existing && existing.id !== coupon.id) {
		await db.delete(coupons).where(eq(coupons.id, existing.id));
	}
	await db
		.insert(coupons)
		.values({ ...coupon, createdAt: now, updatedAt: now })
		.onConflictDoUpdate({
			target: coupons.id,
			set: { ...coupon, updatedAt: now }
		});
}

console.log(
	`商品${productSeeds.length}件、クーポン${couponSeeds.length}件、商品画像${productSeeds.length}件を投入しました。`
);

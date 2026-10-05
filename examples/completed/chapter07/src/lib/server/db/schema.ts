import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	imageKey: text('image_key').notNull(),
	category: text('category', { enum: ['desk', 'stationery', 'accessory'] }).notNull(),
	price: integer('price').notNull(),
	stock: integer('stock').notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const coupons = sqliteTable('coupons', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(),
	discountType: text('discount_type', { enum: ['fixed', 'percentage'] }).notNull(),
	discountValue: integer('discount_value').notNull(),
	minimumSubtotal: integer('minimum_subtotal').notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const orders = sqliteTable('orders', {
	id: text('id').primaryKey(),
	customerId: text('customer_id').notNull(),
	subtotal: integer('subtotal').notNull(),
	couponDiscount: integer('coupon_discount').notNull(),
	shippingFee: integer('shipping_fee').notNull(),
	total: integer('total').notNull(),
	couponCode: text('coupon_code'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const orderItems = sqliteTable('order_items', {
	id: text('id').primaryKey(),
	orderId: text('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	productId: text('product_id').notNull(),
	productName: text('product_name').notNull(),
	unitPrice: integer('unit_price').notNull(),
	quantity: integer('quantity').notNull(),
	lineSubtotal: integer('line_subtotal').notNull()
});

export const reviews = sqliteTable(
	'reviews',
	{
		id: text('id').primaryKey(),
		productId: text('product_id')
			.notNull()
			.references(() => products.id),
		customerId: text('customer_id').notNull(),
		rating: integer('rating').notNull(),
		comment: text('comment').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [uniqueIndex('reviews_customer_product_unique').on(table.customerId, table.productId)]
);

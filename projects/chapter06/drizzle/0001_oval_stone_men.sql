ALTER TABLE `coupons` RENAME COLUMN "discount_amount" TO "discount_value";--> statement-breakpoint
ALTER TABLE `coupons` ADD `discount_type` text DEFAULT 'fixed' NOT NULL;

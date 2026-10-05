import { beforeAll, expect, test } from "bun:test";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/server/db";
import { products, coupons, orders } from "../src/lib/server/db/schema";
import {
  calculateTotals,
  calculateCart,
  placeOrder,
} from "../src/lib/server/services/checkout";

const now = new Date("2026-01-01");
const coupon = {
  code: "TENOFF",
  discountType: "percentage" as const,
  discountValue: 10,
  minimumSubtotal: 0,
  isActive: true,
};
const item = (price: number, quantity = 1) => [
  {
    productId: "author-cable",
    productName: "cable",
    unitPrice: price,
    quantity,
  },
];
beforeAll(() => migrate(db, { migrationsFolder: "./drizzle" }));
test("章6の開始状態と修正後を独立した期待値で確認", async () => {
  const buggy = process.env.EXPECT_SHIPPING_BUG === "1";
  expect(calculateTotals(item(680, 8), coupon)).toMatchObject({
    subtotal: 5440,
    couponDiscount: 544,
    shippingFee: buggy ? 500 : 0,
    total: buggy ? 5396 : 4896,
  });
  expect(calculateTotals([], null)).toMatchObject({
    subtotal: 0,
    shippingFee: 0,
    total: 0,
  });
  await expect(
    placeOrder("demo-customer", [], null, now),
  ).rejects.toMatchObject({ code: "INVALID_CART" });
  if (!buggy) {
    for (const [price, discount, shipping, total] of [
      [4999, 0, 500, 5499],
      [5000, 0, 0, 5000],
      [5000, 500, 0, 4500],
      [100, 100, 500, 500],
    ]) {
      expect(
        calculateTotals(item(price), {
          ...coupon,
          discountType: "fixed",
          discountValue: discount,
        }),
      ).toMatchObject({ shippingFee: shipping, total });
    }
    expect(calculateTotals(item(680), coupon)).toMatchObject({
      shippingFee: 500,
      total: 1112,
    });
    expect(calculateTotals(item(199, 3), coupon)).toMatchObject({
      couponDiscount: 59,
      total: 1038,
    });
  }
  db.insert(products)
    .values({
      id: "author-cable",
      name: "cable",
      description: "author test",
      imageKey: "test.webp",
      category: "desk",
      price: 680,
      stock: 30,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  db.insert(coupons)
    .values({ id: "author-tenoff", ...coupon, createdAt: now, updatedAt: now })
    .run();
  expect(
    await calculateCart([{ productId: "author-cable", quantity: 8 }], "TENOFF"),
  ).toMatchObject({ total: buggy ? 5396 : 4896 });
  const { orderId } = await placeOrder(
    "demo-customer",
    [{ productId: "author-cable", quantity: 8 }],
    "TENOFF",
    now,
  );
  expect(
    db.select().from(orders).where(eq(orders.id, orderId)).get(),
  ).toMatchObject({
    subtotal: 5440,
    couponDiscount: 544,
    shippingFee: buggy ? 500 : 0,
    total: buggy ? 5396 : 4896,
  });
  console.log(JSON.stringify({ orderId, expectedTotal: buggy ? 5396 : 4896 }));
});

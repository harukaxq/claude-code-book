import { beforeAll, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/server/db";
import { products, orders, reviews } from "../src/lib/server/db/schema";
import {
  createReview,
  getProductReviews,
} from "../src/lib/server/services/reviews";
import { placeOrder } from "../src/lib/server/services/checkout";
const now = new Date("2026-01-01");
beforeAll(() => migrate(db, { migrationsFolder: "./drizzle" }));
test("レビュー境界・再購入・DB再接続・商品公開条件", async () => {
  db.insert(products)
    .values({
      id: "author-product",
      name: "保持商品",
      description: "test",
      imageKey: "x.webp",
      category: "desk",
      price: 199,
      stock: 30,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  expect(await getProductReviews("author-product")).toMatchObject({
    reviewCount: 0,
    averageRating: null,
  });
  await expect(
    createReview("demo-customer", "author-product", 4, "test", now),
  ).rejects.toMatchObject({ code: "NOT_PURCHASED" });
  const { orderId } = await placeOrder(
    "demo-customer",
    [{ productId: "author-product", quantity: 1 }],
    null,
    now,
  );
  for (const [rating, comment] of [
    [1.5, "a"],
    [0, "a"],
    [6, "a"],
    [4, "  "],
    [4, "a".repeat(201)],
  ] as const) {
    await expect(
      createReview("demo-customer", "author-product", rating, comment, now),
    ).rejects.toMatchObject({ code: "INVALID_REVIEW" });
  }
  await createReview("demo-customer", "author-product", 1, " a ", now);
  expect((await getProductReviews("author-product")).reviews[0].comment).toBe(
    "a",
  );
  await placeOrder(
    "demo-customer",
    [{ productId: "author-product", quantity: 1 }],
    null,
    now,
  );
  await expect(
    createReview("demo-customer", "author-product", 5, "again", now),
  ).rejects.toMatchObject({ code: "ALREADY_REVIEWED" });
  await placeOrder(
    "other",
    [{ productId: "author-product", quantity: 1 }],
    null,
    now,
  );
  await createReview(
    "other",
    "author-product",
    5,
    " " + "a".repeat(200) + " ",
    now,
  );
  expect(await getProductReviews("author-product")).toMatchObject({
    reviewCount: 2,
    averageRating: 3,
  });
  const disk = new Database(process.env.DATABASE_FILE!, { readonly: true });
  expect(
    disk
      .query("select count(*) as n from reviews where product_id = ?")
      .get("author-product"),
  ).toEqual({ n: 2 });
  disk.close();
  expect(
    db.select().from(orders).where(eq(orders.id, orderId)).get()?.total,
  ).toBe(699);
  db.update(products)
    .set({ isActive: false })
    .where(eq(products.id, "author-product"))
    .run();
  await expect(
    createReview("third", "author-product", 4, "test", now),
  ).rejects.toMatchObject({ code: "PRODUCT_UNAVAILABLE" });
  await expect(
    createReview("third", "missing", 4, "test", now),
  ).rejects.toMatchObject({ code: "PRODUCT_UNAVAILABLE" });
  expect(db.select().from(reviews).all()).toHaveLength(2);
});

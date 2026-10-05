import { expect, test, mock } from "bun:test";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/server/db";
import { products, coupons } from "../src/lib/server/db/schema";
const objects = new Set<string>();
let retained = 0;
mock.module("@aws-sdk/client-s3", () => ({
  CreateBucketCommand: class {},
  PutObjectCommand: class {
    constructor(public input: { Key: string; IfNoneMatch: string }) {}
  },
  S3Client: class {
    async send(command: { input?: { Key: string; IfNoneMatch: string } }) {
      if (!command.input) return;
      expect(command.input.IfNoneMatch).toBe("*");
      if (objects.has(command.input.Key)) {
        retained++;
        const e = new Error("exists");
        e.name = "PreconditionFailed";
        throw e;
      }
      objects.add(command.input.Key);
    }
  },
}));
test("通常seedを二度実行して編集・在庫・クーポン・画像を保持", async () => {
  migrate(db, { migrationsFolder: "./drizzle" });
  await import("../scripts/seed.ts?first");
  db.update(products)
    .set({ name: "編集を保持", price: 777, stock: 7, isActive: false })
    .where(eq(products.id, "product-mini-notebook"))
    .run();
  db.update(coupons)
    .set({ isActive: false })
    .where(eq(coupons.id, "coupon-small100"))
    .run();
  await import("../scripts/seed.ts?second");
  expect(
    db
      .select()
      .from(products)
      .where(eq(products.id, "product-mini-notebook"))
      .get(),
  ).toMatchObject({
    name: "編集を保持",
    price: 777,
    stock: 7,
    isActive: false,
  });
  expect(
    db.select().from(coupons).where(eq(coupons.id, "coupon-small100")).get()
      ?.isActive,
  ).toBe(false);
  expect(db.select().from(products).all()).toHaveLength(5);
  expect(objects.size).toBe(5);
  expect(retained).toBe(5);
});

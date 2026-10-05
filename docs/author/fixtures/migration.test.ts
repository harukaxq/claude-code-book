import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { mkdir, cp, readFile, writeFile } from "node:fs/promises";

test("レビュー追加前のDBをデータを保って追加マイグレーション", async () => {
  const folder = "./author-initial-drizzle";
  await mkdir(folder + "/meta", { recursive: true });
  for (const name of ["0000_loving_bishop.sql", "0001_oval_stone_men.sql"])
    await cp("./drizzle/" + name, folder + "/" + name);
  const journal = JSON.parse(
    await readFile("./drizzle/meta/_journal.json", "utf8"),
  );
  journal.entries = journal.entries.slice(0, 2);
  await writeFile(folder + "/meta/_journal.json", JSON.stringify(journal));
  const sqlite = new Database(process.env.DATABASE_FILE!);
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: folder });
  sqlite.run(
    "INSERT INTO products(id,name,description,image_key,category,price,stock,is_active,created_at,updated_at) VALUES('old','編集商品','test','x.webp','desk',777,13,0,1,1)",
  );
  sqlite.run(
    "INSERT INTO orders(id,customer_id,subtotal,coupon_discount,shipping_fee,total,coupon_code,created_at) VALUES('old-order','demo-customer',777,0,500,1277,NULL,1)",
  );
  const products = sqlite.query("SELECT * FROM products").all();
  const orders = sqlite.query("SELECT * FROM orders").all();
  migrate(db, { migrationsFolder: "./drizzle" });
  expect(sqlite.query("SELECT * FROM products").all()).toEqual(products);
  expect(sqlite.query("SELECT * FROM orders").all()).toEqual(orders);
  expect(sqlite.query("SELECT * FROM reviews").all()).toEqual([]);
  sqlite.close();
});

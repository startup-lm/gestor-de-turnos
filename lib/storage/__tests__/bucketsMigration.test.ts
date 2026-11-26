import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { ALLOWED_BUCKETS } from "@/lib/storage/policy";

describe("migración de buckets de storage", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/20261126000000_ensure_storage_buckets.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  it("garantiza todos los buckets permitidos por la aplicación", () => {
    for (const bucket of ALLOWED_BUCKETS) {
      expect(sql).toContain(`'${bucket}'`);
    }
  });

  it("es idempotente con ON CONFLICT (id) DO NOTHING", () => {
    expect(sql).toContain("ON CONFLICT (id) DO NOTHING");
  });

  it("no contiene operaciones destructivas DROP ni DELETE", () => {
    expect(sql.toUpperCase()).not.toContain("DROP");
    expect(sql.toUpperCase()).not.toContain("DELETE");
  });
});

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function maskUrl(url?: string) {
  if (!url) return "NOT_SET";
  try {
    const u = new URL(url);
    if (u.password) {
      u.password = "****";
    }
    return u.toString();
  } catch {
    return url.replace(/:([^@]+)@/, ":****@");
  }
}

export default async function DebugDbPage() {
  const envInfo = {
    DATABASE_URL: maskUrl(process.env.DATABASE_URL),
    DIRECT_URL: maskUrl(process.env.DIRECT_URL),
    BACKEND_API_URL: process.env.BACKEND_API_URL || "NOT_SET",
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "NOT_SET",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || "NOT_SET",
    VERCEL_ENV: process.env.VERCEL_ENV || "NOT_SET",
  };

  let queryResult: any = null;
  let queryError: any = null;

  try {
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();
    const smesCount = await prisma.sMEProfile.count();
    const sampleProducts = await prisma.product.findMany({
      take: 3,
      select: { id: true, name: true, sku: true, price: true, isActive: true, isApproved: true },
    });

    queryResult = {
      productsCount,
      categoriesCount,
      smesCount,
      sampleProducts,
    };
  } catch (err: any) {
    queryError = {
      message: err?.message || String(err),
      name: err?.name,
      code: err?.code,
      meta: err?.meta,
      stack: err?.stack,
    };
  }

  return (
    <div style={{ padding: 40, fontFamily: "monospace", maxWidth: 900, margin: "0 auto" }}>
      <h1>SokoLink DB Diagnostic</h1>
      <hr />
      <h2>Environment Variables</h2>
      <pre style={{ background: "#f1f5f9", padding: 15, borderRadius: 8 }}>
        {JSON.stringify(envInfo, null, 2)}
      </pre>

      <h2>Database Query Status</h2>
      {queryError ? (
        <div style={{ background: "#fee2e2", border: "1px solid #ef4444", padding: 15, borderRadius: 8 }}>
          <h3 style={{ color: "#b91c1c" }}>❌ Query Failed!</h3>
          <pre>{JSON.stringify(queryError, null, 2)}</pre>
        </div>
      ) : (
        <div style={{ background: "#dcfce7", border: "1px solid #22c55e", padding: 15, borderRadius: 8 }}>
          <h3 style={{ color: "#15803d" }}>✅ Query Succeeded!</h3>
          <pre>{JSON.stringify(queryResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

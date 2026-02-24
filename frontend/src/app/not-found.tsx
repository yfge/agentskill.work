import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>404</h1>
      <p style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
        Page not found / 页面未找到
      </p>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        The page you are looking for does not exist or has been moved.
        <br />
        您访问的页面不存在或已迁移。
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/zh" className="button primary">
          中文首页
        </Link>
        <Link href="/en" className="button">
          English Home
        </Link>
        <Link href="/zh/latest" className="button">
          最新开源
        </Link>
      </div>
    </main>
  );
}

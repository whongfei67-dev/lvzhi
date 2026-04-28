import Link from "next/link";
import styles from "./top-nav.module.css";

const links = [
  { href: "#mvp", label: "MVP 范围" },
  { href: "#roles", label: "角色工作台" },
  { href: "#modules", label: "核心模块" },
  { href: "/workspace", label: "产品骨架" }
];

export function TopNav() {
  return (
    <header className={styles.header}>
      <div className={`page-shell ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          律植（职）
        </Link>
        <nav className={styles.nav}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

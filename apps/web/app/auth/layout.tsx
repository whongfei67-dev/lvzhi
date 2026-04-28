export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't use the global TopNav (it's overridden here)
  return <>{children}</>;
}

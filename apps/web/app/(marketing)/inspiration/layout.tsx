/**
 * 灵感频道统一壳层：左右边缘轻模糊柔化，子页面内容在 .inspiration-channel-content 内叠放。
 */
export default function InspirationChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="inspiration-channel-root">
      <div className="inspiration-channel-content">{children}</div>
    </div>
  );
}

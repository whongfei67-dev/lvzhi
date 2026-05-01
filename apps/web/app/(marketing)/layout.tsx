import { Footer } from "@/components/layout/footer";
import { TopNav } from "@/components/layout/top-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-layout flex min-h-screen flex-col">
      {/* 顶栏在文档流内，通过 z-index 叠在下方主内容之上；主区 -mt-20 上推使大背景顶到视口顶，透明导航可透出图 */}
      <div className="relative z-[200] shrink-0">
        <TopNav />
      </div>
      <div className="relative z-0 -mt-20 flex min-h-0 flex-1 flex-col">
        {children}
        <Footer />
      </div>
    </div>
  );
}

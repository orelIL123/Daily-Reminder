import SiteHeader from '@/components/SiteHeader';
import Storefront from '@/components/Storefront';

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main><Storefront /></main>
    </div>
  );
}

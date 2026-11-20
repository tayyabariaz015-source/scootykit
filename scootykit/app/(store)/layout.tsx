import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getCategories } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  return (
    <>
      <AnnouncementBar settings={settings} />
      <Header categories={categories.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon }))} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} categories={categories} />
    </>
  );
}

import { HeroSlider } from "@/components/HeroSlider";
import { ProductSlider } from "@/components/ProductSlider";
import { CategoryStrip } from "@/components/CategoryStrip";
import { TrustPoints } from "@/components/TrustPoints";
import { Newsletter } from "@/components/Newsletter";
import { getActiveSlides } from "@/lib/slides";
import { getFeaturedProducts, getNewArrivals, getBestSellers } from "@/lib/products";

export default async function HomePage() {
  const [slides, featured, newArrivals, bestSellers] = await Promise.all([
    getActiveSlides(),
    getFeaturedProducts(8),
    getNewArrivals(8),
    getBestSellers(8),
  ]);

  return (
    <>
      <HeroSlider slides={slides} />

      <CategoryStrip />

      <ProductSlider
        title="Fresh from the greenhouse"
        products={featured}
        viewAllHref="/products"
      />

      <div className="border-t border-canopy/10" />

      <ProductSlider
        title="New Arrivals"
        products={newArrivals}
        viewAllHref="/products?badge=New"
        badge="New"
      />

      <div className="border-t border-canopy/10" />

      <ProductSlider
        title="Best Sellers"
        products={bestSellers}
        viewAllHref="/products?badge=Popular"
        badge="Popular"
      />

      <TrustPoints />
      <Newsletter />
    </>
  );
}

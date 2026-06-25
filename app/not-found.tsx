import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="stamp-badge text-clay">404</p>
      <h1 className="mt-3 font-display text-3xl text-canopy">That page didn&apos;t take root.</h1>
      <p className="mt-4 text-sm text-loam/70">
        The page you&apos;re looking for doesn&apos;t exist, or the link may
        be out of date.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex rounded-card bg-canopy px-5 py-2.5 text-sm font-medium text-parchment hover:bg-marigold hover:text-loam"
      >
        Browse products
      </Link>
    </div>
  );
}

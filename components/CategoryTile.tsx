import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function CategoryTile({
  name,
  icon: Icon,
  rotate = "rotate-0",
}: {
  name: string;
  icon: LucideIcon;
  rotate?: string;
}) {
  return (
    <Link
      href={`/products?category=${encodeURIComponent(name)}`}
      className={`seed-packet flex flex-col items-start gap-3 p-4 transition-transform hover:-translate-y-1 hover:rotate-0 ${rotate}`}
    >
      <Icon className="h-6 w-6 text-canopy" strokeWidth={1.5} />
      <span className="font-display text-base text-canopy">{name}</span>
      <span className="stamp-badge text-clay">Shop now →</span>
    </Link>
  );
}

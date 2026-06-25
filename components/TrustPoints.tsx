import { Leaf, Truck, RotateCcw } from "lucide-react";

const points = [
  {
    icon: Leaf,
    title: "Hand-picked quality",
    body: "Every plant and tool is chosen by gardeners, not a catalog algorithm.",
  },
  {
    icon: Truck,
    title: "Ships within 2 days",
    body: "Orders placed before 2pm leave the greenhouse the same day.",
  },
  {
    icon: RotateCcw,
    title: "Easy 30-day returns",
    body: "Not happy with a tool or planter? Send it back, no questions asked.",
  },
];

export function TrustPoints() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-10 sm:grid-cols-3">
        {points.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col items-start gap-3">
            <Icon className="h-6 w-6 text-clay" strokeWidth={1.5} />
            <h3 className="font-display text-lg text-canopy">{title}</h3>
            <p className="text-sm text-loam/80">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

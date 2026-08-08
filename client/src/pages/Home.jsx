import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PizzaCard from '../components/pizza/PizzaCard';
import Button from '../components/ui/Button';
import { PizzaCardSkeleton } from '../components/ui/Skeleton';
import { orders, formatStatus } from '../data/placeholder';
import Badge from '../components/ui/Badge';
import { getPizzas } from '../services/pizzaService';

function Home() {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [heroImage, setHeroImage] = useState(
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=80',
  );
  const latestOrder = orders[0];

  useEffect(() => {
    let active = true;
    getPizzas({ limit: 3, sort: 'popularity' })
      .then((result) => {
        if (!active) return;
        setFeatured(result.pizzas);
        if (result.pizzas[0]?.image) {
          setHeroImage(result.pizzas[0].image);
        }
      })
      .catch(() => {
        if (!active) return;
        setFeatured([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass overflow-hidden rounded-3xl"
      >
        <div className="grid gap-0 md:grid-cols-2">
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-soft)]">
              Tonight&apos;s pick
            </p>
            <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              Hungry again? Your oven is open.
            </h1>
            <p className="mt-3 max-w-md text-[var(--muted)]">
              Reorder favorites, browse the fire menu, or track what&apos;s
              already on the bike.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/menu">Browse menu</Button>
              <Button to="/orders" variant="secondary">
                Track order
              </Button>
            </div>
          </div>
          <div className="relative min-h-56 md:min-h-full">
            <img
              src={heroImage}
              alt="Featured pizza"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/40 md:bg-gradient-to-r md:from-transparent md:to-black/20" />
          </div>
        </div>
      </motion.section>

      {latestOrder ? (
        <section className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">Latest order</p>
            <p className="mt-1 font-display text-xl font-bold">
              {latestOrder.orderNumber}
            </p>
            <div className="mt-2">
              <Badge tone="ember">{formatStatus(latestOrder.status)}</Badge>
            </div>
          </div>
          <Button to="/orders" variant="secondary" size="sm">
            View details
          </Button>
        </section>
      ) : null}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Featured slices</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Top-rated pizzas from the live menu API.
            </p>
          </div>
          <Button to="/menu" variant="ghost" size="sm">
            See all
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PizzaCardSkeleton key={i} />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No pizzas yet. Seed the menu API to populate this section.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((pizza) => (
              <PizzaCard key={pizza.id} pizza={pizza} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;

import { Link } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatPrice } from '../../utils/media';

function PizzaCard({ pizza }) {
  const startingPrice = pizza.sizes?.[0]?.price ?? pizza.basePrice ?? 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="glass group overflow-hidden rounded-2xl"
    >
      <Link to={`/menu/${pizza.id}`} className="block overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={pizza.image}
            alt={pizza.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex gap-2">
            {pizza.isVegetarian ? (
              <Badge tone="success">Veg</Badge>
            ) : (
              <Badge tone="danger">Non-veg</Badge>
            )}
            {!pizza.isAvailable ? (
              <Badge tone="muted">Unavailable</Badge>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              to={`/menu/${pizza.id}`}
              className="font-display text-lg font-bold leading-tight hover:text-[var(--accent-soft)]"
            >
              {pizza.name}
            </Link>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
              {pizza.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-sm text-[var(--gold)]">
            <FiStar />
            <span>{pizza.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-sm text-[var(--muted)]">
            from{' '}
            <span className="text-base font-semibold text-[var(--text)]">
              {formatPrice(startingPrice)}
            </span>
          </p>
          <Button to={`/menu/${pizza.id}`} size="sm" variant="secondary">
            View
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export default PizzaCard;

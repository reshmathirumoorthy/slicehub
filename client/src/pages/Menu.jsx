import { useCallback, useEffect, useState } from 'react';
import PizzaCard from '../components/pizza/PizzaCard';
import EmptyState from '../components/ui/EmptyState';
import { PizzaCardSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { getCategories } from '../services/categoryService';
import { getPizzas } from '../services/pizzaService';
import { formatPrice } from '../utils/media';

function Menu() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [pizzas, setPizzas] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const loadCategories = useCallback(async () => {
    const data = await getCategories();
    setCategories(data);
  }, []);

  const loadPizzas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 9,
        sort,
      };
      if (query.trim()) params.search = query.trim();
      if (activeCategory !== 'all') params.category = activeCategory;
      if (minPrice !== '') params.minPrice = minPrice;
      if (maxPrice !== '') params.maxPrice = maxPrice;

      const result = await getPizzas(params);
      setPizzas(result.pizzas);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load pizzas. Is the API running?',
      );
      setPizzas([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, query, activeCategory, minPrice, maxPrice]);

  useEffect(() => {
    loadCategories().catch(() => {
      setError('Unable to load categories.');
    });
  }, [loadCategories]);

  useEffect(() => {
    loadPizzas();
  }, [loadPizzas]);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput);
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setSearchInput('');
    setQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
          Pizza menu
        </h1>
        <p className="max-w-xl text-[var(--muted)]">
          Search, filter, and sort live menu data from the SliceHub API.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveCategory('all');
            setPage(1);
          }}
          className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
            activeCategory === 'all'
              ? 'border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-soft)]'
              : 'border-white/10 bg-white/5 text-[var(--muted)] hover:text-white'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              setActiveCategory(category.id);
              setPage(1);
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
              activeCategory === category.id
                ? 'border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-soft)]'
                : 'border-white/10 bg-white/5 text-[var(--muted)] hover:text-white'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <form
        onSubmit={applySearch}
        className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search pizzas"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-[var(--accent)]/50 lg:col-span-2"
        />
        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value);
            setPage(1);
          }}
          placeholder="Min price"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-[var(--accent)]/50"
        />
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setPage(1);
          }}
          placeholder="Max price"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-[var(--accent)]/50"
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-white/10 bg-[#111114] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]/50"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popularity">Popularity</option>
          <option value="name_asc">Name</option>
        </select>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" size="sm">
            Search
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={resetFilters}>
            Reset
          </Button>
          <p className="ml-auto self-center text-xs text-[var(--muted)]">
            {pagination.total} result{pagination.total === 1 ? '' : 's'}
          </p>
        </div>
      </form>

      {error ? (
        <div className="glass rounded-2xl border border-[var(--danger)]/30 p-6 text-center">
          <p className="font-semibold text-[var(--danger)]">Something went wrong</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>
          <Button className="mt-4" size="sm" onClick={loadPizzas}>
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PizzaCardSkeleton key={i} />
          ))}
        </div>
      ) : !error && pizzas.length === 0 ? (
        <EmptyState
          title="No pizzas match"
          description="Try another category, price range, or clear your search."
          actionLabel="Reset filters"
          actionTo="/menu"
        />
      ) : !error ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pizzas.map((pizza) => (
              <PizzaCard key={pizza.id} pizza={pizza} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-[var(--muted)]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
          {(minPrice || maxPrice) && (
            <p className="text-center text-xs text-[var(--muted)]">
              Price filter:{' '}
              {minPrice ? formatPrice(minPrice) : 'any'} –{' '}
              {maxPrice ? formatPrice(maxPrice) : 'any'}
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

export default Menu;

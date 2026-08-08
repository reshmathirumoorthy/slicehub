import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg font-bold">
            Slice<span className="text-[var(--accent)]">Hub</span>
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Wood-fired craft. City-speed delivery.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <Link to="/builder" className="hover:text-white">
            Builder
          </Link>
          <Link to="/menu" className="hover:text-white">
            Menu
          </Link>
          <Link to="/orders" className="hover:text-white">
            Orders
          </Link>
          <Link to="/admin" className="hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

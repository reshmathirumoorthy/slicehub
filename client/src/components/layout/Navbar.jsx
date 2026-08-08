import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiMenu, FiShoppingBag, FiX } from 'react-icons/fi';
import Button from '../ui/Button';
import { useCart } from '../../context/useCart';
import { getUserToken } from '../../services/api';

const links = [
  { to: '/home', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/builder', label: 'Builder' },
  { to: '/orders', label: 'Orders' },
  { to: '/profile', label: 'Profile' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const signedIn = Boolean(getUserToken());

  const linkClass = ({ isActive }) =>
    [
      'rounded-lg px-3 py-2 text-sm font-medium transition',
      isActive
        ? 'bg-white/10 text-white'
        : 'text-[var(--muted)] hover:bg-white/5 hover:text-white',
    ].join(' ');

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgb(7_7_8_/0.72)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
          Slice<span className="text-[var(--accent)]">Hub</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button to="/cart" variant="secondary" size="sm">
            <FiShoppingBag />
            Cart{count > 0 ? ` (${count})` : ''}
          </Button>
          {signedIn ? (
            <Button to="/profile" size="sm" variant="ghost">
              Account
            </Button>
          ) : (
            <Button to="/login" size="sm">
              Sign in
            </Button>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/cart"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              Cart{count > 0 ? ` (${count})` : ''}
            </NavLink>
            <Button
              to={signedIn ? '/profile' : '/login'}
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              {signedIn ? 'Account' : 'Sign in'}
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;

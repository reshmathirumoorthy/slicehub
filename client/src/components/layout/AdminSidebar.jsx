import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiLayers,
  FiTag,
  FiFolder,
  FiStar,
  FiBell,
} from 'react-icons/fi';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin/pizzas', label: 'Pizzas', icon: FiBox },
  { to: '/admin/categories', label: 'Categories', icon: FiFolder },
  { to: '/admin/inventory', label: 'Inventory', icon: FiLayers },
  { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
  { to: '/admin/notifications', label: 'Notifications', icon: FiBell },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/coupons', label: 'Coupons', icon: FiTag },
];

function AdminSidebar({ onNavigate }) {
  const linkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-[var(--accent)]/20 text-[var(--accent-soft)]'
        : 'text-[var(--muted)] hover:bg-white/5 hover:text-white',
    ].join(' ');

  return (
    <aside className="glass-strong flex w-full flex-col rounded-2xl p-4 lg:sticky lg:top-24 lg:w-64 lg:self-start">
      <p className="mb-4 px-2 font-display text-lg font-bold">
        Admin<span className="text-[var(--accent)]">Desk</span>
      </p>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={linkClass}
            onClick={onNavigate}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;

import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import MarketingLayout from '../layouts/MarketingLayout';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import Landing from '../pages/Landing';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Menu from '../pages/Menu';
import PizzaDetails from '../pages/PizzaDetails';
import PizzaBuilder from '../pages/PizzaBuilder';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Orders from '../pages/Orders';
import OrderDetails from '../pages/OrderDetails';
import OrderSuccess from '../pages/OrderSuccess';
import Profile from '../pages/Profile';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminMenu from '../pages/admin/MenuManager';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminInventory from '../pages/admin/AdminInventory';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminReviews from '../pages/admin/AdminReviews';
import AdminNotifications from '../pages/admin/AdminNotifications';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminPlaceholder from '../pages/admin/Placeholder';
import NotificationsPage from '../pages/Notifications';
import NotFound, { ErrorPage } from '../pages/errors/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MarketingLayout />,
    errorElement: <ErrorPage />,
    children: [{ index: true, element: <Landing /> }],
  },
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/verify-email', element: <VerifyEmail /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },
  {
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/home', element: <Home /> },
      { path: '/menu', element: <Menu /> },
      { path: '/menu/:id', element: <PizzaDetails /> },
      { path: '/builder', element: <PizzaBuilder /> },
      { path: '/cart', element: <Cart /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/orders', element: <Orders /> },
      { path: '/orders/success/:id', element: <OrderSuccess /> },
      { path: '/orders/:id', element: <OrderDetails /> },
      { path: '/profile', element: <Profile /> },
      { path: '/notifications', element: <NotificationsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'login', element: <AdminLogin /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'pizzas', element: <AdminMenu /> },
      { path: 'menu', element: <Navigate to="/admin/pizzas" replace /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'inventory', element: <AdminInventory /> },
      { path: 'reviews', element: <AdminReviews /> },
      { path: 'notifications', element: <AdminNotifications /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'customers', element: <Navigate to="/admin/users" replace /> },
      { path: 'coupons', element: <AdminPlaceholder title="Admin Coupons" /> },
    ],
  },
  { path: '/404', element: <NotFound /> },
  { path: '*', element: <NotFound /> },
  { path: '/app', element: <Navigate to="/home" replace /> },
]);

function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminAuthRoutes from './adminAuth.routes.js';
import categoryRoutes from './category.routes.js';
import pizzaRoutes from './pizza.routes.js';
import builderRoutes from './builder.routes.js';
import cartRoutes from './cart.routes.js';
import addressRoutes from './address.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import adminOrderRoutes from './adminOrder.routes.js';
import adminInventoryRoutes from './adminInventory.routes.js';
import adminDashboardRoutes from './adminDashboard.routes.js';
import adminUserRoutes from './adminUser.routes.js';
import reviewRoutes from './review.routes.js';
import adminReviewRoutes from './adminReview.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SliceHub API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/admin/reviews', adminReviewRoutes);
router.use('/reviews', reviewRoutes);
router.use('/categories', categoryRoutes);
router.use('/builder', builderRoutes);
router.use('/cart', cartRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/inventory', adminInventoryRoutes);
router.use('/pizzas', pizzaRoutes);

export default router;

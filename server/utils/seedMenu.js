/**
 * Seeds sample categories and pizzas for local development / API tests.
 *
 * Usage: node utils/seedMenu.js
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import Category from '../models/Category.js';
import Pizza from '../models/Pizza.js';
import {
  PIZZA_BASES,
  PIZZA_CHEESES,
  PIZZA_SAUCES,
  PIZZA_SIZES,
  PIZZA_VEGETABLES,
} from '../models/constants.js';

const categorySeed = [
  {
    name: 'Classic',
    slug: 'classic',
    description: 'Timeless wood-fired favorites',
    sortOrder: 1,
  },
  {
    name: 'Veggie',
    slug: 'veggie',
    description: 'Garden-forward pies',
    sortOrder: 2,
  },
  {
    name: 'Meat Lovers',
    slug: 'meat-lovers',
    description: 'Bold, protein-packed slices',
    sortOrder: 3,
  },
  {
    name: 'Premium',
    slug: 'premium',
    description: 'Chef specials and luxury toppings',
    sortOrder: 4,
  },
];

const pizzaSeed = (categoriesBySlug) => [
  {
    name: 'Margherita Ember',
    slug: 'margherita-ember',
    description:
      'San Marzano tomato, fior di latte, basil oil, and a blistered crust.',
    category: categoriesBySlug.classic._id,
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80',
    basePrice: 249,
    sizes: [
      { size: PIZZA_SIZES.SMALL, price: 249 },
      { size: PIZZA_SIZES.MEDIUM, price: 399 },
      { size: PIZZA_SIZES.LARGE, price: 549 },
    ],
    availableBases: [PIZZA_BASES.THIN, PIZZA_BASES.THICK],
    availableSauces: [PIZZA_SAUCES.TOMATO],
    availableCheeses: [PIZZA_CHEESES.MOZZARELLA],
    availableVegetables: [PIZZA_VEGETABLES.TOMATO, PIZZA_VEGETABLES.SPINACH],
    extraCheesePrice: 40,
    isVegetarian: true,
    isAvailable: true,
    averageRating: 4.8,
    reviewCount: 214,
  },
  {
    name: 'Smokehouse Pepperoni',
    slug: 'smokehouse-pepperoni',
    description:
      'Double pepperoni cups, smoked mozzarella, chili honey drizzle.',
    category: categoriesBySlug['meat-lovers']._id,
    image:
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=80',
    basePrice: 299,
    sizes: [
      { size: PIZZA_SIZES.SMALL, price: 299 },
      { size: PIZZA_SIZES.MEDIUM, price: 449 },
      { size: PIZZA_SIZES.LARGE, price: 599 },
    ],
    availableBases: [PIZZA_BASES.THIN, PIZZA_BASES.CHEESE_BURST],
    availableSauces: [PIZZA_SAUCES.TOMATO, PIZZA_SAUCES.SPICY],
    availableCheeses: [PIZZA_CHEESES.MOZZARELLA, PIZZA_CHEESES.MIXED],
    availableVegetables: [PIZZA_VEGETABLES.JALAPENO, PIZZA_VEGETABLES.ONION],
    extraCheesePrice: 50,
    isVegetarian: false,
    isAvailable: true,
    averageRating: 4.9,
    reviewCount: 388,
  },
  {
    name: 'Forest Mushroom',
    slug: 'forest-mushroom',
    description:
      'Roasted forest mushrooms, thyme cream, garlic confit, pecorino.',
    category: categoriesBySlug.veggie._id,
    image:
      'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=80',
    basePrice: 279,
    sizes: [
      { size: PIZZA_SIZES.SMALL, price: 279 },
      { size: PIZZA_SIZES.MEDIUM, price: 429 },
      { size: PIZZA_SIZES.LARGE, price: 579 },
    ],
    availableBases: [PIZZA_BASES.THIN, PIZZA_BASES.WHOLE_WHEAT],
    availableSauces: [PIZZA_SAUCES.WHITE, PIZZA_SAUCES.PESTO],
    availableCheeses: [PIZZA_CHEESES.MOZZARELLA, PIZZA_CHEESES.PARMESAN],
    availableVegetables: [
      PIZZA_VEGETABLES.MUSHROOM,
      PIZZA_VEGETABLES.SPINACH,
      PIZZA_VEGETABLES.OLIVES,
    ],
    extraCheesePrice: 45,
    isVegetarian: true,
    isAvailable: true,
    averageRating: 4.6,
    reviewCount: 156,
  },
  {
    name: 'Truffle Midnight',
    slug: 'truffle-midnight',
    description:
      'Black truffle cream, wild mushrooms, aged parmesan, micro greens.',
    category: categoriesBySlug.premium._id,
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    basePrice: 449,
    sizes: [
      { size: PIZZA_SIZES.SMALL, price: 449 },
      { size: PIZZA_SIZES.MEDIUM, price: 649 },
      { size: PIZZA_SIZES.LARGE, price: 849 },
    ],
    availableBases: [PIZZA_BASES.THIN, PIZZA_BASES.GLUTEN_FREE],
    availableSauces: [PIZZA_SAUCES.WHITE],
    availableCheeses: [PIZZA_CHEESES.PARMESAN, PIZZA_CHEESES.MOZZARELLA],
    availableVegetables: [PIZZA_VEGETABLES.MUSHROOM, PIZZA_VEGETABLES.SPINACH],
    extraCheesePrice: 70,
    isVegetarian: true,
    isAvailable: true,
    averageRating: 4.9,
    reviewCount: 97,
  },
  {
    name: 'Inferno Hot Honey',
    slug: 'inferno-hot-honey',
    description:
      'Spicy salami, pickled jalapeño, hot honey, and stretchy mozzarella.',
    category: categoriesBySlug['meat-lovers']._id,
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
    basePrice: 319,
    sizes: [
      { size: PIZZA_SIZES.SMALL, price: 319 },
      { size: PIZZA_SIZES.MEDIUM, price: 469 },
      { size: PIZZA_SIZES.LARGE, price: 619 },
    ],
    availableBases: [PIZZA_BASES.THICK, PIZZA_BASES.CHEESE_BURST],
    availableSauces: [PIZZA_SAUCES.SPICY, PIZZA_SAUCES.BBQ],
    availableCheeses: [PIZZA_CHEESES.MOZZARELLA, PIZZA_CHEESES.CHEDDAR],
    availableVegetables: [PIZZA_VEGETABLES.JALAPENO, PIZZA_VEGETABLES.ONION],
    extraCheesePrice: 55,
    isVegetarian: false,
    isAvailable: true,
    averageRating: 4.7,
    reviewCount: 241,
  },
  {
    name: 'Garden Caprese',
    slug: 'garden-caprese',
    description:
      'Heirloom tomato, burrata pockets, pesto swirl, cracked pepper.',
    category: categoriesBySlug.veggie._id,
    image:
      'https://images.unsplash.com/photo-1571407970349-bc81e7e336d3?auto=format&fit=crop&w=1200&q=80',
    basePrice: 269,
    sizes: [
      { size: PIZZA_SIZES.SMALL, price: 269 },
      { size: PIZZA_SIZES.MEDIUM, price: 419 },
      { size: PIZZA_SIZES.LARGE, price: 569 },
    ],
    availableBases: [PIZZA_BASES.THIN, PIZZA_BASES.WHOLE_WHEAT],
    availableSauces: [PIZZA_SAUCES.PESTO, PIZZA_SAUCES.TOMATO],
    availableCheeses: [PIZZA_CHEESES.MOZZARELLA, PIZZA_CHEESES.VEGAN],
    availableVegetables: [
      PIZZA_VEGETABLES.TOMATO,
      PIZZA_VEGETABLES.OLIVES,
      PIZZA_VEGETABLES.CAPSICUM,
    ],
    extraCheesePrice: 40,
    isVegetarian: true,
    isAvailable: true,
    averageRating: 4.5,
    reviewCount: 132,
  },
];

const seedMenu = async () => {
  await mongoose.connect(env.mongodbUri);

  for (const category of categorySeed) {
    await Category.findOneAndUpdate({ slug: category.slug }, category, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  const categories = await Category.find({
    slug: { $in: categorySeed.map((c) => c.slug) },
  });
  const categoriesBySlug = Object.fromEntries(
    categories.map((c) => [c.slug, c]),
  );

  const pizzas = pizzaSeed(categoriesBySlug);
  for (const pizza of pizzas) {
    await Pizza.findOneAndUpdate({ slug: pizza.slug }, pizza, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  console.log(
    `Menu seeded: ${categories.length} categories, ${pizzas.length} pizzas`,
  );
  await mongoose.disconnect();
};

seedMenu().catch(async (error) => {
  console.error('Failed to seed menu:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

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

const V = PIZZA_VEGETABLES;
const B = PIZZA_BASES;
const S = PIZZA_SAUCES;
const C = PIZZA_CHEESES;

/** Verified Unsplash pizza photos (HEAD 200). Broken IDs remapped to known-good shots. */
const IMG = {
  margherita:
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80',
  pepperoni:
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=80',
  pepperoniChicken:
    'https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&w=1200&q=80',
  veggie:
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=80',
  classic:
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
  spicy:
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
  caprese:
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80',
  cheese:
    'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=1200&q=80',
  fresh:
    'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=1200&q=80',
  herb:
    'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=80',
  meat:
    'https://images.unsplash.com/photo-1458642849426-cfb724f15ef7?auto=format&fit=crop&w=1200&q=80',
  oven:
    'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?auto=format&fit=crop&w=1200&q=80',
  chili:
    'https://images.unsplash.com/photo-1555072956-7758afb20e8f?auto=format&fit=crop&w=1200&q=80',
  sliceBoard:
    'https://images.unsplash.com/photo-1520201163981-8cc95007dd2a?auto=format&fit=crop&w=1200&q=80',
  oliveTop:
    'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?auto=format&fit=crop&w=1200&q=80',
  tomatoClose:
    'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1200&q=80',
  rusticBoard:
    'https://images.unsplash.com/photo-1552539618-7eec9b4d1796?auto=format&fit=crop&w=1200&q=80',
  cheesePull:
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80',
};

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
    name: 'Paneer',
    slug: 'paneer',
    description: 'Paneer-forward vegetarian specials',
    sortOrder: 3,
  },
  {
    name: 'Chicken',
    slug: 'chicken',
    description: 'Grilled and spiced chicken pizzas',
    sortOrder: 4,
  },
  {
    name: 'Spicy',
    slug: 'spicy',
    description: 'Heat-forward sauces and chillies',
    sortOrder: 5,
  },
  {
    name: 'Meat Lovers',
    slug: 'meat-lovers',
    description: 'Bold, protein-packed slices',
    sortOrder: 6,
  },
  {
    name: 'Premium',
    slug: 'premium',
    description: 'Chef specials and luxury toppings',
    sortOrder: 7,
  },
];

const sizeTier = (small, medium, large) => [
  { size: PIZZA_SIZES.SMALL, price: small },
  { size: PIZZA_SIZES.MEDIUM, price: medium },
  { size: PIZZA_SIZES.LARGE, price: large },
];

const pizza = (cats, def) => ({
  availableBases: [B.THIN, B.THICK],
  availableSauces: [S.TOMATO],
  availableCheeses: [C.MOZZARELLA],
  availableVegetables: [V.ONION, V.TOMATO],
  extraCheesePrice: 45,
  isAvailable: true,
  averageRating: 4.6,
  reviewCount: 120,
  ...def,
  category: cats[def.categorySlug]._id,
});

const pizzaSeed = (cats) => [
  pizza(cats, {
    name: 'Margherita Ember',
    slug: 'margherita-ember',
    description:
      'San Marzano tomato, fior di latte, basil oil, and a blistered crust.',
    categorySlug: 'classic',
    image: IMG.margherita,
    basePrice: 249,
    sizes: sizeTier(249, 399, 549),
    availableBases: [B.THIN, B.THICK],
    availableSauces: [S.TOMATO],
    availableCheeses: [C.MOZZARELLA],
    availableVegetables: [V.TOMATO, V.SPINACH],
    extraCheesePrice: 40,
    isVegetarian: true,
    averageRating: 4.8,
    reviewCount: 214,
  }),
  pizza(cats, {
    name: 'Farmhouse',
    slug: 'farmhouse',
    description:
      'Onion, capsicum, tomato, and corn on a classic tomato base.',
    categorySlug: 'classic',
    image: IMG.veggie,
    basePrice: 279,
    sizes: sizeTier(279, 429, 579),
    availableVegetables: [V.ONION, V.CAPSICUM, V.TOMATO, V.CORN, V.MUSHROOM],
    isVegetarian: true,
    averageRating: 4.7,
    reviewCount: 301,
  }),
  pizza(cats, {
    name: 'Cheese & Corn',
    slug: 'cheese-and-corn',
    description: 'Sweet corn kernels buried under stretchy mozzarella.',
    categorySlug: 'classic',
    image: IMG.cheese,
    basePrice: 259,
    sizes: sizeTier(259, 409, 559),
    availableVegetables: [V.CORN, V.CAPSICUM],
    availableCheeses: [C.MOZZARELLA, C.MIXED],
    isVegetarian: true,
    averageRating: 4.5,
    reviewCount: 188,
  }),
  pizza(cats, {
    name: 'Veggie Delight',
    slug: 'veggie-delight',
    description:
      'Loaded garden veggies — onion, capsicum, olives, mushroom, and tomato.',
    categorySlug: 'veggie',
    image: IMG.fresh,
    basePrice: 289,
    sizes: sizeTier(289, 439, 589),
    availableVegetables: [
      V.ONION,
      V.CAPSICUM,
      V.OLIVES,
      V.MUSHROOM,
      V.TOMATO,
      V.SPINACH,
    ],
    isVegetarian: true,
    averageRating: 4.6,
    reviewCount: 210,
  }),
  pizza(cats, {
    name: 'Double Cheese',
    slug: 'double-cheese',
    description: 'Extra mozzarella melt with cheddar ribbons on a thick crust.',
    categorySlug: 'classic',
    image: IMG.sliceBoard,
    basePrice: 299,
    sizes: sizeTier(299, 449, 599),
    availableBases: [B.THICK, B.CHEESE_BURST],
    availableCheeses: [C.MOZZARELLA, C.CHEDDAR, C.MIXED],
    availableVegetables: [V.TOMATO],
    extraCheesePrice: 30,
    isVegetarian: true,
    averageRating: 4.8,
    reviewCount: 265,
  }),
  pizza(cats, {
    name: 'Forest Mushroom',
    slug: 'forest-mushroom',
    description:
      'Roasted forest mushrooms, thyme cream, garlic confit, pecorino.',
    categorySlug: 'veggie',
    image: IMG.oliveTop,
    basePrice: 279,
    sizes: sizeTier(279, 429, 579),
    availableBases: [B.THIN, B.WHOLE_WHEAT],
    availableSauces: [S.WHITE, S.PESTO],
    availableCheeses: [C.MOZZARELLA, C.PARMESAN],
    availableVegetables: [V.MUSHROOM, V.SPINACH, V.OLIVES],
    isVegetarian: true,
    averageRating: 4.6,
    reviewCount: 156,
  }),
  pizza(cats, {
    name: 'Garden Caprese',
    slug: 'garden-caprese',
    description:
      'Heirloom tomato, burrata pockets, pesto swirl, cracked pepper.',
    categorySlug: 'veggie',
    image: IMG.caprese,
    basePrice: 269,
    sizes: sizeTier(269, 419, 569),
    availableBases: [B.THIN, B.WHOLE_WHEAT],
    availableSauces: [S.PESTO, S.TOMATO],
    availableCheeses: [C.MOZZARELLA, C.VEGAN],
    availableVegetables: [V.TOMATO, V.OLIVES, V.CAPSICUM],
    isVegetarian: true,
    averageRating: 4.5,
    reviewCount: 132,
  }),
  pizza(cats, {
    name: 'Paneer Tikka Pizza',
    slug: 'paneer-tikka',
    description:
      'Tandoori-spiced paneer cubes, onion, and capsicum over spicy marinara.',
    categorySlug: 'paneer',
    image: IMG.herb,
    basePrice: 319,
    sizes: sizeTier(319, 469, 619),
    availableSauces: [S.SPICY, S.TOMATO],
    availableVegetables: [V.ONION, V.CAPSICUM, V.TOMATO, V.JALAPENO],
    isVegetarian: true,
    averageRating: 4.8,
    reviewCount: 412,
  }),
  pizza(cats, {
    name: 'Spicy Paneer',
    slug: 'spicy-paneer',
    description: 'Paneer with jalapeño heat and smoked paprika oil.',
    categorySlug: 'paneer',
    image: IMG.spicy,
    basePrice: 329,
    sizes: sizeTier(329, 479, 629),
    availableSauces: [S.SPICY, S.BBQ],
    availableVegetables: [V.JALAPENO, V.ONION, V.CAPSICUM],
    isVegetarian: true,
    averageRating: 4.7,
    reviewCount: 198,
  }),
  pizza(cats, {
    name: 'Paneer & Capsicum',
    slug: 'paneer-capsicum',
    description: 'Soft paneer with sweet green capsicum and oregano.',
    categorySlug: 'paneer',
    image: IMG.tomatoClose,
    basePrice: 309,
    sizes: sizeTier(309, 459, 609),
    availableVegetables: [V.CAPSICUM, V.ONION, V.CORN],
    isVegetarian: true,
    averageRating: 4.6,
    reviewCount: 167,
  }),
  pizza(cats, {
    name: 'Chicken Tikka',
    slug: 'chicken-tikka',
    description:
      'Charred tikka-spiced chicken, onions, and a tangy tomato swirl.',
    categorySlug: 'chicken',
    image: IMG.meat,
    basePrice: 349,
    sizes: sizeTier(349, 499, 649),
    availableSauces: [S.TOMATO, S.SPICY],
    availableVegetables: [V.ONION, V.CAPSICUM, V.JALAPENO],
    isVegetarian: false,
    averageRating: 4.8,
    reviewCount: 356,
  }),
  pizza(cats, {
    name: 'BBQ Chicken',
    slug: 'bbq-chicken',
    description: 'Smoky BBQ glaze, chicken pieces, red onion, and cheddar.',
    categorySlug: 'chicken',
    image: IMG.rusticBoard,
    basePrice: 359,
    sizes: sizeTier(359, 509, 659),
    availableSauces: [S.BBQ, S.TOMATO],
    availableCheeses: [C.MOZZARELLA, C.CHEDDAR],
    availableVegetables: [V.ONION, V.CORN],
    isVegetarian: false,
    averageRating: 4.7,
    reviewCount: 289,
  }),
  pizza(cats, {
    name: 'Chicken Pepperoni',
    slug: 'chicken-pepperoni',
    description: 'Chicken pepperoni cups with chili flakes and mozzarella.',
    categorySlug: 'chicken',
    image: IMG.pepperoniChicken,
    basePrice: 369,
    sizes: sizeTier(369, 519, 669),
    availableBases: [B.THIN, B.CHEESE_BURST],
    availableSauces: [S.TOMATO, S.SPICY],
    availableVegetables: [V.JALAPENO, V.ONION],
    isVegetarian: false,
    averageRating: 4.9,
    reviewCount: 388,
  }),
  pizza(cats, {
    name: 'Peri-Peri Chicken',
    slug: 'peri-peri-chicken',
    description: 'Fiery peri-peri chicken with roasted capsicum strips.',
    categorySlug: 'chicken',
    image: IMG.chili,
    basePrice: 379,
    sizes: sizeTier(379, 529, 679),
    availableSauces: [S.SPICY, S.BBQ],
    availableVegetables: [V.CAPSICUM, V.ONION, V.JALAPENO],
    isVegetarian: false,
    averageRating: 4.8,
    reviewCount: 244,
  }),
  pizza(cats, {
    name: 'Chicken Supreme',
    slug: 'chicken-supreme',
    description:
      'Loaded chicken, mushroom, onion, and olives on a hand-tossed base.',
    categorySlug: 'chicken',
    image: IMG.classic,
    basePrice: 389,
    sizes: sizeTier(389, 539, 689),
    availableVegetables: [V.MUSHROOM, V.ONION, V.OLIVES, V.CAPSICUM],
    isVegetarian: false,
    averageRating: 4.7,
    reviewCount: 201,
  }),
  pizza(cats, {
    name: 'Smokehouse Pepperoni',
    slug: 'smokehouse-pepperoni',
    description:
      'Double pepperoni cups, smoked mozzarella, chili honey drizzle.',
    categorySlug: 'meat-lovers',
    image: IMG.pepperoni,
    basePrice: 299,
    sizes: sizeTier(299, 449, 599),
    availableBases: [B.THIN, B.CHEESE_BURST],
    availableSauces: [S.TOMATO, S.SPICY],
    availableCheeses: [C.MOZZARELLA, C.MIXED],
    availableVegetables: [V.JALAPENO, V.ONION],
    extraCheesePrice: 50,
    isVegetarian: false,
    averageRating: 4.9,
    reviewCount: 388,
  }),
  pizza(cats, {
    name: 'Inferno Hot Honey',
    slug: 'inferno-hot-honey',
    description:
      'Spicy salami, pickled jalapeño, hot honey, and stretchy mozzarella.',
    categorySlug: 'spicy',
    image: IMG.spicy,
    basePrice: 319,
    sizes: sizeTier(319, 469, 619),
    availableBases: [B.THICK, B.CHEESE_BURST],
    availableSauces: [S.SPICY, S.BBQ],
    availableCheeses: [C.MOZZARELLA, C.CHEDDAR],
    availableVegetables: [V.JALAPENO, V.ONION],
    extraCheesePrice: 55,
    isVegetarian: false,
    averageRating: 4.7,
    reviewCount: 241,
  }),
  pizza(cats, {
    name: 'Mexican Spicy',
    slug: 'mexican-spicy',
    description:
      'Mexican spice blend, jalapeño, onion, corn, and fiery marinara.',
    categorySlug: 'spicy',
    image: IMG.oven,
    basePrice: 329,
    sizes: sizeTier(329, 479, 629),
    availableSauces: [S.SPICY],
    availableVegetables: [V.JALAPENO, V.ONION, V.CORN, V.CAPSICUM],
    isVegetarian: true,
    averageRating: 4.6,
    reviewCount: 175,
  }),
  pizza(cats, {
    name: 'Fiery Jalapeño',
    slug: 'fiery-jalapeno',
    description: 'Pickled jalapeño rings and chili oil on molten cheese.',
    categorySlug: 'spicy',
    image: IMG.tomatoClose,
    basePrice: 299,
    sizes: sizeTier(299, 449, 599),
    availableSauces: [S.SPICY, S.TOMATO],
    availableVegetables: [V.JALAPENO, V.ONION],
    isVegetarian: true,
    averageRating: 4.5,
    reviewCount: 143,
  }),
  pizza(cats, {
    name: 'Spicy Chicken',
    slug: 'spicy-chicken',
    description: 'Hot chicken, jalapeño, and peri heat on a thick crust.',
    categorySlug: 'spicy',
    image: IMG.oven,
    basePrice: 369,
    sizes: sizeTier(369, 519, 669),
    availableBases: [B.THICK, B.CHEESE_BURST],
    availableSauces: [S.SPICY, S.BBQ],
    availableVegetables: [V.JALAPENO, V.CAPSICUM, V.ONION],
    isVegetarian: false,
    averageRating: 4.7,
    reviewCount: 192,
  }),
  pizza(cats, {
    name: 'Four Cheese',
    slug: 'four-cheese',
    description:
      'Mozzarella, cheddar, parmesan, and mixed melt with herb oil.',
    categorySlug: 'premium',
    image: IMG.cheesePull,
    basePrice: 399,
    sizes: sizeTier(399, 579, 759),
    availableBases: [B.THIN, B.CHEESE_BURST],
    availableSauces: [S.WHITE, S.TOMATO],
    availableCheeses: [C.MIXED, C.MOZZARELLA, C.PARMESAN, C.CHEDDAR],
    availableVegetables: [V.SPINACH],
    extraCheesePrice: 35,
    isVegetarian: true,
    averageRating: 4.9,
    reviewCount: 220,
  }),
  pizza(cats, {
    name: 'Italian Herb',
    slug: 'italian-herb',
    description:
      'Oregano-garlic herb crust, olive oil, tomato, and fresh greens.',
    categorySlug: 'premium',
    image: IMG.herb,
    basePrice: 379,
    sizes: sizeTier(379, 549, 719),
    availableBases: [B.THIN, B.WHOLE_WHEAT],
    availableSauces: [S.PESTO, S.TOMATO],
    availableCheeses: [C.MOZZARELLA, C.PARMESAN],
    availableVegetables: [V.TOMATO, V.OLIVES, V.SPINACH],
    isVegetarian: true,
    averageRating: 4.7,
    reviewCount: 134,
  }),
  pizza(cats, {
    name: 'Gourmet Veggie',
    slug: 'gourmet-veggie',
    description:
      'Artisan veggie mix with pesto drizzle and aged parmesan finish.',
    categorySlug: 'premium',
    image: IMG.sliceBoard,
    basePrice: 389,
    sizes: sizeTier(389, 559, 729),
    availableBases: [B.THIN, B.GLUTEN_FREE],
    availableSauces: [S.PESTO, S.WHITE],
    availableCheeses: [C.PARMESAN, C.MOZZARELLA],
    availableVegetables: [
      V.MUSHROOM,
      V.OLIVES,
      V.SPINACH,
      V.CAPSICUM,
      V.TOMATO,
    ],
    isVegetarian: true,
    averageRating: 4.8,
    reviewCount: 158,
  }),
  pizza(cats, {
    name: 'Meat Supreme',
    slug: 'meat-supreme',
    description:
      'Pepperoni, chicken, onion, and jalapeño — the ultimate meat load.',
    categorySlug: 'premium',
    image: IMG.classic,
    basePrice: 429,
    sizes: sizeTier(429, 619, 799),
    availableBases: [B.THICK, B.CHEESE_BURST],
    availableSauces: [S.TOMATO, S.BBQ, S.SPICY],
    availableCheeses: [C.MOZZARELLA, C.MIXED],
    availableVegetables: [V.ONION, V.JALAPENO, V.MUSHROOM],
    extraCheesePrice: 60,
    isVegetarian: false,
    averageRating: 4.9,
    reviewCount: 276,
  }),
  pizza(cats, {
    name: 'Truffle Midnight',
    slug: 'truffle-midnight',
    description:
      'Black truffle cream, wild mushrooms, aged parmesan, micro greens.',
    categorySlug: 'premium',
    image: IMG.oliveTop,
    basePrice: 449,
    sizes: sizeTier(449, 649, 849),
    availableBases: [B.THIN, B.GLUTEN_FREE],
    availableSauces: [S.WHITE],
    availableCheeses: [C.PARMESAN, C.MOZZARELLA],
    availableVegetables: [V.MUSHROOM, V.SPINACH],
    extraCheesePrice: 70,
    isVegetarian: true,
    averageRating: 4.9,
    reviewCount: 97,
  }),
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
  for (const item of pizzas) {
    const doc = { ...item };
    delete doc.categorySlug;
    await Pizza.findOneAndUpdate({ slug: doc.slug }, doc, {
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

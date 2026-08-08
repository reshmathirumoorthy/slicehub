import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Footer from '../components/layout/Footer';
import PizzaFallback from '../components/3d/PizzaFallback';

const PizzaHero = lazy(() => import('../components/3d/PizzaHero'));

function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(255,107,53,0.22),transparent_50%),radial-gradient(ellipse_at_80%_0%,rgba(255,200,87,0.12),transparent_40%),linear-gradient(180deg,#0a0706_0%,#120d0a_55%,#070708_100%)]" />
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="h-full w-full object-cover mix-blend-luminosity"
            aria-hidden="true"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-4 sm:px-6">
          <header className="flex items-center justify-between py-6">
            <p className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Slice<span className="text-[var(--accent)]">Hub</span>
            </p>
            <div className="flex items-center gap-2">
              <Button to="/login" variant="secondary" size="sm">
                Sign in
              </Button>
              <Button to="/builder" size="sm" className="hidden sm:inline-flex">
                Build a pizza
              </Button>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-8 pb-16 pt-6 lg:grid-cols-2">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="max-w-xl font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-6xl"
              >
                Fire, crust, and city-speed delivery.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12 }}
                className="mt-5 max-w-lg text-base text-white/75 sm:text-lg"
              >
                Design your pie in 3D — then track it from oven to door.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.22 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Button to="/builder" size="lg">
                  Open pizza builder
                </Button>
                <Button to="/menu" variant="secondary" size="lg">
                  Explore the menu
                </Button>
              </motion.div>
            </div>

            <Suspense
              fallback={
                <PizzaFallback className="min-h-[320px]" compact label="Loading 3D pizza" />
              }
            >
              <PizzaHero />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          Built for the second slice.
        </h2>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          From blistered crusts to live order tracking, SliceHub keeps the
          ritual simple — pick, pay, and pull the box open.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: '3D custom builder',
              copy: 'Watch every topping land as you craft your pie.',
            },
            {
              title: 'Oven-first menu',
              copy: 'Classics, veggie gardens, and premium nightcaps.',
            },
            {
              title: 'Tracked to the door',
              copy: 'Follow every order from flame to hallway.',
            },
          ].map((item) => (
            <div key={item.title} className="glass rounded-2xl p-6">
              <h3 className="font-display text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link
            to="/home"
            className="text-sm font-semibold text-[var(--accent-soft)] hover:underline"
          >
            Enter the app →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Landing;

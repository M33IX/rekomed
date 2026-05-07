'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { PublicCatalogPage } from '@/lib/cms-content'
import { getManufacturerCatalogHref } from '@/lib/catalog-links'

type FeaturedManufacturerSectionProps = {
  brands: PublicCatalogPage[]
  products: PublicCatalogPage[]
}

const getInitial = (title: string) => title.trim().slice(0, 1).toUpperCase() || 'R'

export function FeaturedManufacturerSection({ brands, products }: FeaturedManufacturerSectionProps) {
  const reduced = useReducedMotion()
  const manufacturers = useMemo(
    () =>
      brands
        .map((brand) => ({
          ...brand,
          productCount: products.filter((product) => product.brandTitle === brand.h1).length
        }))
        .filter((brand) => brand.productCount > 0)
        .sort((a, b) => b.productCount - a.productCount || a.h1.localeCompare(b.h1, 'ru'))
        .slice(0, 8),
    [brands, products]
  )
  const [activePath, setActivePath] = useState(manufacturers[0]?.path || '')
  const active = manufacturers.find((brand) => brand.path === activePath) || manufacturers[0]

  if (!active || manufacturers.length < 2) return null

  return (
    <section className="manufacturer-feature" aria-labelledby="manufacturer-feature-title">
      <div className="manufacturer-feature-copy">
        <span className="section-kicker">Бренды в каталоге</span>
        <AnimatePresence mode="wait">
          <motion.div
            key={active.path}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.26 }}
          >
            <h2 id="manufacturer-feature-title">{active.h1}</h2>
            <p>
              В каталоге есть {active.productCount} {active.productCount === 1 ? 'позиция' : 'позиций'} этого производителя.
              Перейдите к отфильтрованному списку, если нужно быстро собрать запрос по бренду.
            </p>
            <div className="manufacturer-actions">
              <Link className="primary-action" href={getManufacturerCatalogHref(active.h1)}>
                Изделия производителя
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="outline-action" href="/catalog/">
                Весь каталог
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="manufacturer-logo-card"
          key={active.path}
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 14 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
          transition={{ duration: 0.26 }}
        >
          {active.image ? (
            <img src={active.image} alt={`Логотип ${active.h1}`} loading="lazy" />
          ) : (
            <span>{getInitial(active.h1)}</span>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="manufacturer-tabs" role="tablist" aria-label="Производители в каталоге">
        {manufacturers.map((brand) => (
          <button
            type="button"
            key={brand.path}
            role="tab"
            aria-selected={brand.path === active.path}
            className={brand.path === active.path ? 'active' : ''}
            onClick={() => setActivePath(brand.path)}
          >
            {brand.h1}
            <span>{brand.productCount}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

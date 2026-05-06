'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { PublicCatalogPage } from '@/lib/cms-content'

type ManufacturerListingProps = {
  brands: PublicCatalogPage[]
  products: PublicCatalogPage[]
  activeBrandPath?: string
}

const norm = (value: string) => value.toLowerCase().replaceAll('ё', 'е').trim()
const catalogManufacturerHref = (title: string) => `/catalog/?manufacturer=${encodeURIComponent(title)}`

export function ManufacturerListing({ brands, products, activeBrandPath }: ManufacturerListingProps) {
  const [query, setQuery] = useState('')
  const reduced = useReducedMotion()
  const manufacturers = useMemo(
    () =>
      brands
        .map((brand) => ({
          ...brand,
          productCount: products.filter((product) => product.brandTitle === brand.h1).length
        }))
        .filter((brand) => brand.productCount > 0 && brand.path !== '/brands/')
        .sort((a, b) => b.productCount - a.productCount || a.h1.localeCompare(b.h1, 'ru')),
    [brands, products]
  )
  const filtered = useMemo(() => {
    const search = norm(query)
    if (!search) return manufacturers
    return manufacturers.filter((brand) => norm(`${brand.h1} ${brand.description}`).includes(search))
  }, [manufacturers, query])

  return (
    <div className="manufacturer-listing">
      <label className="manufacturer-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти производителя"
          aria-label="Поиск по производителям"
        />
      </label>
      {filtered.length > 0 ? (
        <div className="manufacturer-grid">
          {filtered.map((brand, index) => (
            <motion.div
              key={brand.path}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.24, delay: Math.min(index, 8) * 0.035 }}
            >
              <Link className={brand.path === activeBrandPath ? 'manufacturer-card active' : 'manufacturer-card'} href={catalogManufacturerHref(brand.h1)}>
                <span>
                  {brand.image ? <img src={brand.image} alt="" loading="lazy" /> : brand.h1.slice(0, 1).toUpperCase()}
                </span>
                <strong>{brand.h1}</strong>
                <small>{brand.productCount > 0 ? `${brand.productCount} позиций в каталоге` : 'Позиции по запросу'}</small>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state compact-empty">
          <h3>Производитель не найден</h3>
          <p>Попробуйте другой запрос или отправьте заявку на подбор изделия.</p>
          <Link className="primary-action" href="/contacts/stores/#lead">
            Отправить запрос
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  )
}

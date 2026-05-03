'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import type { PublicCatalogPage } from '@/lib/cms-content'
import {
  formatCatalogCount,
  getCategoryNode,
  getTopCatalogNodes,
  isWorkingCategory
} from '@/lib/catalog-hierarchy'

type CatalogExplorerProps = {
  categories: PublicCatalogPage[]
  products: PublicCatalogPage[]
}

const norm = (value: string) => value.toLowerCase().replaceAll('ё', 'е').trim()

const uniqueByPath = (items: PublicCatalogPage[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.path)) return false
    seen.add(item.path)
    return true
  })
}

export function CatalogExplorer({ categories, products }: CatalogExplorerProps) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => getTopCatalogNodes(categories, products), [categories, products])

  const search = norm(query)
  const isSearching = search.length >= 2

  const foundCategories = isSearching
    ? categories.filter(
        (category) =>
          isWorkingCategory(category, categories, products) &&
          norm(`${category.h1} ${category.title} ${category.description}`).includes(search)
      )
    : []
  const foundProducts = isSearching
    ? products
        .filter((product) => norm(`${product.h1} ${product.title} ${product.id} ${product.description}`).includes(search))
        .slice(0, 24)
    : []

  return (
    <div className="catalog-explorer">
      <label className="catalog-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти раздел, изделие или артикул"
          aria-label="Поиск по каталогу"
        />
      </label>

      {isSearching ? (
        <div className="catalog-search-results">
          <div className="section-head">
            <span className="section-kicker">Результаты поиска</span>
            <h2>{foundCategories.length + foundProducts.length ? 'Найдено в каталоге' : 'Ничего не найдено'}</h2>
            {!foundCategories.length && !foundProducts.length && (
              <p>Попробуйте другое название, артикул или оставьте запрос менеджеру.</p>
            )}
          </div>

          {foundCategories.length > 0 && (
            <div className="category-grid compact">
              {uniqueByPath(foundCategories).map((category) => (
                <Link className="category-tile" href={category.path} key={category.path}>
                  <span>{category.h1}</span>
                  <small>{formatCatalogCount(getCategoryNode(category, categories, products).descendantProductCount)}</small>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}

          {foundProducts.length > 0 && (
            <div className="catalog-result-list">
              {foundProducts.map((product) => (
                <Link href={product.path} key={product.path}>
                  <span>{product.h1}</span>
                  <small>{product.id ? `Артикул ${product.id}` : 'Карточка изделия'}</small>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="catalog-group-grid">
            {groups.map((group) => (
              <article className="catalog-group-card" key={group.category.path}>
                <div className="catalog-group-media">
                  {group.image ? <img src={group.image} alt="" loading="lazy" /> : <span>{group.category.h1.slice(0, 1)}</span>}
                </div>
                <div>
                  <h2>
                    <Link href={group.category.path}>{group.category.h1}</Link>
                  </h2>
                  <div className="catalog-group-links">
                    {group.children.map((item) => (
                      <Link href={item.path} key={item.path}>
                        {item.h1}
                      </Link>
                    ))}
                  </div>
                  {group.descendantProductCount > 0 && <p>{formatCatalogCount(group.descendantProductCount)}</p>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

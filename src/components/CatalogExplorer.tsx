'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { PublicCatalogPage } from '@/lib/cms-content'
import { normalizeDirectionSlug, updateCatalogSearchParams } from '@/lib/catalog-links'
import {
  formatCatalogCount,
  getCategoryAncestors,
  getCategoryNode,
  getTopCatalogNodes,
  isWorkingCategory
} from '@/lib/catalog-hierarchy'
import { ProductCard } from '@/components/catalog/ProductCard'

type CatalogExplorerProps = {
  categories: PublicCatalogPage[]
  products: PublicCatalogPage[]
  initialDirection?: string
}

type SortMode = 'popular' | 'title' | 'article'

const norm = (value: string) => value.toLowerCase().replaceAll('ё', 'е').trim()

const includesQuery = (product: PublicCatalogPage, query: string) => {
  const attributes = Object.entries(product.attributes || {})
    .map(([label, value]) => `${label} ${value}`)
    .join(' ')

  return norm(`${product.h1} ${product.title} ${product.id} ${product.description} ${attributes}`).includes(query)
}

export function CatalogExplorer({ categories, products, initialDirection }: CatalogExplorerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState(initialDirection || searchParams.get('direction') || 'all')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [brand, setBrand] = useState(searchParams.get('manufacturer') || searchParams.get('brand') || 'all')
  const [docsOnly, setDocsOnly] = useState(false)
  const [sort, setSort] = useState<SortMode>('popular')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const reduced = useReducedMotion()

  const categoryBySection = useMemo(() => new Map(categories.map((item) => [item.section, item])), [categories])
  const topNodes = useMemo(() => getTopCatalogNodes(categories, products), [categories, products])
  const workingCategories = useMemo(
    () =>
      categories
        .filter((item) => isWorkingCategory(item, categories, products))
        .sort((a, b) => a.h1.localeCompare(b.h1, 'ru')),
    [categories, products]
  )
  const categoryOptions = useMemo(() => {
    if (direction === 'all') return workingCategories

    return workingCategories.filter((item) => {
      if (item.section === direction) return true
      return getCategoryAncestors(item, categories).some((ancestor) => ancestor.section === direction)
    })
  }, [categories, direction, workingCategories])
  const brands = useMemo(
    () =>
      Array.from(new Set(products.map((item) => item.brandTitle).filter((item): item is string => Boolean(item))))
        .sort((a, b) => a.localeCompare(b, 'ru')),
    [products]
  )

  useEffect(() => {
    const directionParam = searchParams.get('direction') || initialDirection
    const normalizedDirectionParam = normalizeDirectionSlug(directionParam)
    const matchedDirection = directionParam
      ? topNodes.find((node) => node.category.section === normalizedDirectionParam || norm(node.category.h1) === norm(directionParam))
      : undefined

    setDirection(matchedDirection?.category.section || 'all')
  }, [initialDirection, searchParams, topNodes])

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const matchedCategory = categoryParam
      ? workingCategories.find((item) => item.section === categoryParam || norm(item.h1) === norm(categoryParam))
      : undefined

    setCategory(matchedCategory?.section || 'all')
  }, [searchParams, workingCategories])

  useEffect(() => {
    const manufacturerParam = searchParams.get('manufacturer') || searchParams.get('brand')
    const matchedBrand = manufacturerParam
      ? brands.find((item) => item === manufacturerParam) || brands.find((item) => norm(item) === norm(manufacturerParam))
      : undefined

    setBrand(matchedBrand || 'all')
  }, [brands, searchParams])

  const categoryPathSections = (product: PublicCatalogPage) => {
    const productCategory = categoryBySection.get(product.section)
    if (!productCategory) return [product.section]
    return [product.section, ...getCategoryAncestors(productCategory, categories).map((item) => item.section)]
  }

  useEffect(() => {
    if (category !== 'all' && !categoryOptions.some((item) => item.section === category)) {
      setCategory('all')
    }
  }, [category, categoryOptions])

  const filteredProducts = useMemo(() => {
    const search = norm(query)
    const filtered = products.filter((product) => {
      const sections = categoryPathSections(product)
      const matchesQuery = search.length < 2 || includesQuery(product, search)
      const matchesDirection = direction === 'all' || sections.includes(direction)
      const matchesCategory = category === 'all' || sections.includes(category)
      const matchesBrand = brand === 'all' || product.brandTitle === brand
      const matchesDocs = !docsOnly || Boolean(product.documentsCount)

      return matchesQuery && matchesDirection && matchesCategory && matchesBrand && matchesDocs
    })

    if (sort === 'title') return [...filtered].sort((a, b) => a.h1.localeCompare(b.h1, 'ru'))
    if (sort === 'article') return [...filtered].sort((a, b) => String(a.id || '').localeCompare(String(b.id || ''), 'ru', { numeric: true }))
    return filtered
  }, [brand, category, direction, docsOnly, products, query, sort])

  const setDirectionFilter = (value: string) => {
    const nextDirection = value === 'all' ? 'all' : value
    setDirection(nextDirection)
    setCategory('all')
    router.replace(
      updateCatalogSearchParams(searchParams, {
        direction: nextDirection === 'all' ? null : nextDirection,
        category: null
      }),
      { scroll: false }
    )
  }

  const setCategoryFilter = (value: string) => {
    setCategory(value)
    router.replace(
      updateCatalogSearchParams(searchParams, {
        category: value === 'all' ? null : value
      }),
      { scroll: false }
    )
  }

  const setBrandFilter = (value: string) => {
    setBrand(value)
    router.replace(
      updateCatalogSearchParams(searchParams, {
        manufacturer: value === 'all' ? null : value
      }),
      { scroll: false }
    )
  }

  const resetFilters = () => {
    setQuery('')
    setDirection('all')
    setCategory('all')
    setBrand('all')
    setDocsOnly(false)
    setSort('popular')
    router.replace('/catalog/', { scroll: false })
  }

  const activeDirection = topNodes.find((node) => node.category.section === direction)?.category
  const activeCategory = workingCategories.find((item) => item.section === category)
  const hasActiveFilters = Boolean(activeDirection || activeCategory || brand !== 'all' || docsOnly)

  const filterPanel = (
    <div className="filter-panel">
      <div className="filter-panel-head">
        <span>Фильтры</span>
        <button type="button" className="icon-button mobile-only" aria-label="Закрыть фильтры" onClick={() => setFiltersOpen(false)}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <label>
        <span>Направление</span>
        <select value={direction} onChange={(event) => setDirectionFilter(event.target.value)}>
          <option value="all">Все направления</option>
          {topNodes.map((node) => (
            <option key={node.category.section} value={node.category.section}>
              {node.category.h1}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Категория</span>
        <select value={category} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">Все категории</option>
          {categoryOptions.map((item) => (
            <option key={item.section} value={item.section}>
              {item.h1}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Производитель</span>
        <select value={brand} onChange={(event) => setBrandFilter(event.target.value)} disabled={brands.length === 0}>
          <option value="all">Все производители</option>
          {brands.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="filter-checks">
        <legend>Документы</legend>
        <label>
          <input type="checkbox" checked={docsOnly} onChange={(event) => setDocsOnly(event.target.checked)} />
          <span>Есть прикрепленные документы</span>
        </label>
        <label className="muted-check">
          <input type="checkbox" disabled />
          <span>Регистрационное удостоверение</span>
        </label>
        <label className="muted-check">
          <input type="checkbox" disabled />
          <span>Сертификат соответствия</span>
        </label>
      </fieldset>
      <button type="button" className="outline-action full-action" onClick={resetFilters}>
        <RotateCcw size={16} aria-hidden="true" />
        Сбросить
      </button>
      <button type="button" className="primary-action full-action" onClick={() => setFiltersOpen(false)}>
        Показать {filteredProducts.length}
      </button>
    </div>
  )

  return (
    <div className="catalog-explorer" id="catalog-search">
      <div className="catalog-hero-tools">
        <label className="catalog-search">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти раздел, изделие или артикул"
            aria-label="Поиск по каталогу"
          />
        </label>
        <button type="button" className="outline-action mobile-filter-toggle" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={18} aria-hidden="true" />
          Фильтры
        </button>
      </div>

      <div className="category-chip-row" aria-label="Быстрые направления">
        <button type="button" className={direction === 'all' ? 'active' : ''} onClick={() => setDirectionFilter('all')}>
          Все
        </button>
        {topNodes.map((node) => (
          <button
            type="button"
            key={node.category.section}
            className={direction === node.category.section ? 'active' : ''}
            onClick={() => setDirectionFilter(node.category.section)}
          >
            {node.category.h1}
            <span>{node.descendantProductCount}</span>
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <div className="active-filter-row" aria-label="Активные фильтры">
          <span>Активные фильтры:</span>
          {activeDirection && (
            <button type="button" onClick={() => setDirectionFilter('all')}>
              {activeDirection.h1}
              <X size={14} aria-hidden="true" />
            </button>
          )}
          {activeCategory && (
            <button type="button" onClick={() => setCategoryFilter('all')}>
              {activeCategory.h1}
              <X size={14} aria-hidden="true" />
            </button>
          )}
          {brand !== 'all' && (
            <button type="button" onClick={() => setBrandFilter('all')}>
              {brand}
              <X size={14} aria-hidden="true" />
            </button>
          )}
          {docsOnly && (
            <button type="button" onClick={() => setDocsOnly(false)}>
              Только с документами
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="catalog-layout">
        <aside className="filter-sidebar" aria-label="Фильтры каталога">
          {filterPanel}
        </aside>

        <div className="catalog-results">
          <div className="catalog-results-head">
            <div>
              <span className="section-kicker">Найдено</span>
              <h2>{formatCatalogCount(filteredProducts.length)}</h2>
            </div>
            <label className="sort-select">
              <span>Сортировка</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                <option value="popular">По популярности</option>
                <option value="title">По названию</option>
                <option value="article">По артикулу</option>
              </select>
            </label>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="product-grid catalog-product-grid">
              {filteredProducts.slice(0, 48).map((product) => (
                <ProductCard
                  key={product.path}
                  product={product}
                  categoryTitle={categoryBySection.get(product.section)?.h1 || product.categoryTitle}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Filter size={28} aria-hidden="true" />
              <h3>{activeDirection ? 'В этом направлении пока нет позиций' : 'Ничего не найдено'}</h3>
              <p>
                {activeDirection
                  ? 'Отправьте запрос - менеджер проверит изделие или предложит аналог.'
                  : 'Попробуйте изменить запрос или отправьте заявку: менеджер проверит позицию вручную.'}
              </p>
              <Link className="primary-action" href="/contacts/stores/#lead">
                Отправить запрос
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}

          <div className="catalog-help-card">
            <div>
              <span className="section-kicker">Не нашли изделие?</span>
              <h3>Отправьте запрос менеджеру</h3>
              <p>Укажите артикул, название или задачу. Мы проверим позицию, аналоги и доступные документы.</p>
            </div>
            <Link className="outline-action" href="/contacts/stores/#lead">
              Отправить запрос
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="sheet-backdrop"
            role="presentation"
            onMouseDown={() => setFiltersOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="filter-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Фильтры каталога"
              onMouseDown={(event) => event.stopPropagation()}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.22 }}
            >
              {filterPanel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

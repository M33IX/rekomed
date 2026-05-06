'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { PublicCatalogPage } from '@/lib/cms-content'
import { fadeUp } from '@/lib/motion'

type CommandSearchProps = {
  categories: PublicCatalogPage[]
  products: PublicCatalogPage[]
}

const normalize = (value: string) => value.toLowerCase().replaceAll('ё', 'е').trim()

const popularQueries = ['Кейджи', 'Пластины', 'Шовный материал', 'Артикул 1026']

export function CommandSearch({ categories, products }: CommandSearchProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const search = normalize(query)
  const results = useMemo(() => {
    if (search.length < 2) return []
    const categoryMatches = categories
      .filter((item) => normalize(`${item.h1} ${item.title} ${item.description}`).includes(search))
      .slice(0, 3)
      .map((item) => ({ href: item.path, title: item.h1, meta: 'Раздел каталога' }))
    const productMatches = products
      .filter((item) => normalize(`${item.h1} ${item.title} ${item.id} ${item.description}`).includes(search))
      .slice(0, 4)
      .map((item) => ({ href: item.path, title: item.h1, meta: item.id ? `Артикул ${item.id}` : 'Карточка изделия' }))

    return [...categoryMatches, ...productMatches].slice(0, 6)
  }, [categories, products, search])

  const showDropdown = focused || search.length >= 2

  return (
    <div className="command-search" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
    }}>
      <label className="command-search-field">
        <Search size={20} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Найти изделие, категорию или артикул..."
          aria-label="Поиск изделия, категории или артикула"
        />
        <span className="shortcut-hint">Ctrl / ⌘ + K</span>
      </label>
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="command-dropdown"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            {results.length > 0 ? (
              <div className="command-results">
                {results.map((item) => (
                  <Link href={item.href} key={`${item.href}-${item.title}`}>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </span>
                    <CornerDownLeft size={16} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : (
              <motion.div className="popular-searches" variants={fadeUp}>
                <span>Популярные запросы</span>
                <div>
                  {popularQueries.map((item) => (
                    <button type="button" key={item} onClick={() => setQuery(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            <Link className="command-action" href="/contacts/stores/#lead">
              Не нашли изделие? Отправить запрос
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

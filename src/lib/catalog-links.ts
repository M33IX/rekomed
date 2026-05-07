import { parentBySection, topCatalogSections } from '@/lib/catalog-hierarchy'

type CatalogFilterValue = string | null | undefined

type CatalogFilterParams = {
  direction?: CatalogFilterValue
  category?: CatalogFilterValue
  manufacturer?: CatalogFilterValue
}

const catalogBasePath = '/catalog'

const directionAliases: Record<string, string> = {
  hirurgiya: 'khirurgiya',
  neyrohirurgiya: 'neyrokhirurgiya',
  reabilitaciya: 'reabilitatsiya'
}

export const normalizeDirectionSlug = (section: string | undefined | null) =>
  section ? directionAliases[section] || section : ''

export const isCatalogDirectionSection = (section: string | undefined | null) =>
  Boolean(section && topCatalogSections.includes(normalizeDirectionSlug(section)))

export const getTopDirectionSection = (section: string | undefined | null) => {
  let current = normalizeDirectionSlug(section)
  const seen = new Set<string>()

  while (current && !seen.has(current)) {
    if (isCatalogDirectionSection(current)) return current
    seen.add(current)
    current = parentBySection[current] || ''
  }

  return ''
}

export const getCatalogHref = (params: CatalogFilterParams = {}) => {
  const searchParams = new URLSearchParams()

  if (params.direction) searchParams.set('direction', normalizeDirectionSlug(params.direction))
  if (params.category) searchParams.set('category', params.category)
  if (params.manufacturer) searchParams.set('manufacturer', params.manufacturer)

  const query = searchParams.toString()
  return query ? `${catalogBasePath}?${query}` : `${catalogBasePath}/`
}

export const getDirectionCatalogHref = (direction: string) => getCatalogHref({ direction: normalizeDirectionSlug(direction) })

export const getCategoryCatalogHref = (category: string, direction?: string) =>
  getCatalogHref({ direction: direction || getTopDirectionSection(category), category })

export const getManufacturerCatalogHref = (manufacturer: string) => getCatalogHref({ manufacturer })

export const getDirectionLandingCatalogHref = (sections: string[]) => {
  const primarySection = sections.find((section) => isCatalogDirectionSection(section))
  const inferredDirection = primarySection || sections.map(getTopDirectionSection).find(Boolean) || sections[0] || ''
  const firstCategory = primarySection
    ? undefined
    : sections.length === 1
      ? sections.find((section) => section !== inferredDirection && !isCatalogDirectionSection(section))
      : undefined

  return getCatalogHref({
    direction: inferredDirection || undefined,
    category: firstCategory
  })
}

export const updateCatalogSearchParams = (
  current: URLSearchParams,
  updates: CatalogFilterParams
) => {
  const next = new URLSearchParams(current.toString())

  for (const [key, value] of Object.entries(updates)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }

  next.delete('brand')
  const query = next.toString()
  return query ? `${catalogBasePath}?${query}` : `${catalogBasePath}/`
}

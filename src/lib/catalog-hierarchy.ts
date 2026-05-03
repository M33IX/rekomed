import hierarchy from '@/data/catalog-hierarchy.json'

export type CatalogCategoryLike = {
  section: string
  h1: string
  title: string
  path: string
  image?: string
  imageAlt?: string
  parentSection?: string | null
  sortOrder?: number | null
}

export type CatalogProductLike = {
  section: string
  image?: string
}

type VirtualCategory = {
  title: string
  path: string
  imageSections?: string[]
}

export type CatalogNode<T extends CatalogCategoryLike = CatalogCategoryLike> = {
  category: T
  children: T[]
  productCount: number
  descendantProductCount: number
  image: string
}

const childrenByParent = hierarchy.children as Record<string, string[]>
const virtualCategories = hierarchy.virtualCategories as Record<string, VirtualCategory>

export const topCatalogSections = hierarchy.topSections

export const parentBySection = Object.entries(childrenByParent).reduce<Record<string, string>>((acc, [parent, children]) => {
  for (const child of children) acc[child] = parent
  return acc
}, {})

const orderBySection = new Map<string, number>()
let order = 0

for (const section of topCatalogSections) {
  orderBySection.set(section, order++)
  for (const child of childrenByParent[section] || []) {
    orderBySection.set(child, order++)
    for (const nestedChild of childrenByParent[child] || []) {
      orderBySection.set(nestedChild, order++)
    }
  }
}

export const getFallbackParentSection = (section: string) => parentBySection[section] || ''

export const getFallbackSortOrder = (section: string) => orderBySection.get(section) ?? 1000

export const getConfiguredChildSections = (section: string) => childrenByParent[section] || []

export const getVirtualCategory = (section: string) => virtualCategories[section]

export const formatCatalogCount = (count: number) => {
  if (!count) return 'раздел каталога'
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} позиция`
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${count} позиции`
  return `${count} позиций`
}

const uniqueByPath = <T extends CatalogCategoryLike>(items: T[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.path)) return false
    seen.add(item.path)
    return true
  })
}

export const sortCategories = <T extends CatalogCategoryLike>(items: T[]) =>
  [...items].sort((a, b) => {
    const orderA = a.sortOrder ?? getFallbackSortOrder(a.section)
    const orderB = b.sortOrder ?? getFallbackSortOrder(b.section)
    return orderA - orderB || a.h1.localeCompare(b.h1, 'ru')
  })

export const countDirectProducts = <TProduct extends CatalogProductLike>(products: TProduct[], section: string) =>
  products.filter((product) => product.section === section).length

export const getCategoryChildren = <TCategory extends CatalogCategoryLike>(
  categories: TCategory[],
  parentSection: string
) => {
  const bySection = new Map(categories.map((category) => [category.section, category]))
  const configured = getConfiguredChildSections(parentSection).map((section) => bySection.get(section)).filter(Boolean) as TCategory[]
  const managed = categories.filter((category) => category.parentSection === parentSection)
  return sortCategories(uniqueByPath([...configured, ...managed]))
}

export const isWorkingCategory = <TCategory extends CatalogCategoryLike, TProduct extends CatalogProductLike>(
  category: TCategory,
  categories: TCategory[],
  products: TProduct[]
): boolean =>
  countDirectProducts(products, category.section) > 0 ||
  getCategoryChildren(categories, category.section).some((child) => isWorkingCategory(child, categories, products))

export const getWorkingCategoryChildren = <TCategory extends CatalogCategoryLike, TProduct extends CatalogProductLike>(
  categories: TCategory[],
  products: TProduct[],
  parentSection: string
) => getCategoryChildren(categories, parentSection).filter((child) => isWorkingCategory(child, categories, products))

export const countDescendantProducts = <TCategory extends CatalogCategoryLike, TProduct extends CatalogProductLike>(
  category: TCategory,
  categories: TCategory[],
  products: TProduct[]
): number =>
  countDirectProducts(products, category.section) +
  getCategoryChildren(categories, category.section).reduce(
    (total, child) => total + countDescendantProducts(child, categories, products),
    0
  )

export const getCategoryNode = <TCategory extends CatalogCategoryLike, TProduct extends CatalogProductLike>(
  category: TCategory,
  categories: TCategory[],
  products: TProduct[]
): CatalogNode<TCategory> => {
  const children = getWorkingCategoryChildren(categories, products, category.section)
  const childImage = children.find((child) => child.image)?.image || ''

  return {
    category,
    children,
    productCount: countDirectProducts(products, category.section),
    descendantProductCount: countDescendantProducts(category, categories, products),
    image: category.image || childImage || ''
  }
}

export const getCategoryAncestors = <TCategory extends CatalogCategoryLike>(
  category: TCategory,
  categories: TCategory[]
) => {
  const bySection = new Map(categories.map((item) => [item.section, item]))
  const ancestors: TCategory[] = []
  let parentSection = category.parentSection || getFallbackParentSection(category.section)

  while (parentSection) {
    const parent = bySection.get(parentSection)
    if (!parent || ancestors.some((item) => item.section === parent.section)) break
    ancestors.unshift(parent)
    parentSection = parent.parentSection || getFallbackParentSection(parent.section)
  }

  return ancestors
}

export const getTopCatalogNodes = <TCategory extends CatalogCategoryLike, TProduct extends CatalogProductLike>(
  categories: TCategory[],
  products: TProduct[]
): CatalogNode<TCategory>[] => {
  const bySection = new Map(categories.map((category) => [category.section, category]))

  return topCatalogSections
    .map((section) => {
      const category = bySection.get(section)
      const virtual = getVirtualCategory(section)
      const effectiveCategory =
        category && virtual
          ? ({ ...category, h1: virtual.title, title: virtual.title, path: virtual.path } as TCategory)
          : category ||
        (virtual
          ? ({
              section,
              h1: virtual.title,
              title: virtual.title,
              path: virtual.path,
              image: ''
            } as TCategory)
          : undefined)

      if (!effectiveCategory) return null
      const node = getCategoryNode(effectiveCategory, categories, products)
      const imageSections = virtual?.imageSections || []
      const virtualImage =
        imageSections.map((imageSection) => bySection.get(imageSection)?.image).find(Boolean) ||
        products.find((product) => imageSections.includes(product.section) && product.image)?.image

      return {
        ...node,
        image: node.image || virtualImage || ''
      }
    })
    .filter((node): node is CatalogNode<TCategory> => Boolean(node))
    .filter((node) => node.descendantProductCount > 0)
}

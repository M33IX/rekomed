import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import type { PublicCatalogPage } from '@/lib/cms-content'

type ProductCardProps = {
  product: PublicCatalogPage
  categoryTitle?: string
}

export const fallbackProductImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" rx="28" fill="%23EEF7F6"/><rect x="92" y="92" width="456" height="296" rx="24" fill="%23FFFFFF" stroke="%23BBD1D0" stroke-width="12"/><path d="M156 174h328M156 238h228M156 302h286" stroke="%23087A8A" stroke-width="18" stroke-linecap="round"/><circle cx="476" cy="304" r="34" fill="%23DDF2EF" stroke="%230AA37F" stroke-width="10"/></svg>'

const compactAttributes = (product: PublicCatalogPage) =>
  Object.entries(product.attributes || {})
    .filter(([, value]) => Boolean(value))
    .slice(0, 2)

export function ProductCard({ product, categoryTitle }: ProductCardProps) {
  const attrs = compactAttributes(product)
  const leadHref = `${product.path}#product-lead`

  return (
    <article className="product-card">
      <Link className="product-card-media" href={product.path} aria-label={product.h1}>
        <img src={product.image || fallbackProductImage} alt={product.imageAlt || product.h1} loading="lazy" />
      </Link>
      <div className="product-card-body">
        <div className="product-card-meta">
          <span className="status-badge">Цена по запросу</span>
          <span>{product.id ? `Артикул ${product.id}` : 'Артикул по запросу'}</span>
        </div>
        <h3>
          <Link href={product.path}>{product.h1}</Link>
        </h3>
        <p>{categoryTitle || product.categoryTitle || 'Медицинское изделие'}</p>
        {attrs.length > 0 && (
          <dl className="mini-specs">
            {attrs.map(([label, value]) => (
              <div key={`${product.path}-${label}`}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="product-card-actions">
        <Link className="primary-action small-action" href={leadHref}>
          Запросить цену
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link className="ghost-action small-action" href={product.path}>
          <FileText size={16} aria-hidden="true" />
          Подробнее
        </Link>
      </div>
    </article>
  )
}

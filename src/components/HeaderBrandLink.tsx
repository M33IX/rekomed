'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function HeaderBrandLink() {
  const pathname = usePathname()

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/') return

    event.preventDefault()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <Link className="brand" href="/" aria-label="RekoMed — на главную" onClick={handleClick}>
      <span className="brand-mark">R</span>
      <strong>RekoMed</strong>
    </Link>
  )
}

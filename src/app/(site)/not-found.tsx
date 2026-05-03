import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="page-hero compact-hero">
      <span className="section-kicker">404</span>
      <h1>Страница не найдена</h1>
      <p>Перейдите в каталог или оставьте заявку, если нужна конкретная позиция, документ или коммерческое предложение.</p>
      <Link className="primary-action" href="/catalog/">
        Открыть каталог
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  )
}

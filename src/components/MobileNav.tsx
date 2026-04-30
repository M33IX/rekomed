'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { company, navigation } from '@/lib/content'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mobile-nav">
      <button className="mobile-menu" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} onClick={() => setOpen((value) => !value)}>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      {open && (
        <div className="mobile-drawer">
          <nav aria-label="Мобильная навигация">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mobile-drawer-actions">
            <a href={company.phoneHref}>{company.phone}</a>
            <a href="#lead" onClick={() => setOpen(false)}>
              Получить КП
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

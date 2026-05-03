'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { company, navigation } from '@/lib/content'

type MobileNavProps = {
  phone?: string
  phoneHref?: string
  leadHref?: string
}

export function MobileNav({ phone = company.phone, phoneHref = company.phoneHref, leadHref = '/contacts/stores/#lead' }: MobileNavProps) {
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
            <a href={phoneHref}>{phone}</a>
            <a href={leadHref} onClick={() => setOpen(false)}>
              Получить КП
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, Menu, Phone, Send, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { navigation } from '@/lib/content'

type MobileNavProps = {
  phone: string
  phoneHref: string
  email: string
  emailHref: string
  leadHref: string
}

const mobileNavigationOrder = ['Каталог', 'Направления', 'Документы', 'О компании', 'Контакты']
const mobileNavigation = mobileNavigationOrder
  .map((label) => navigation.find((item) => item.label === label))
  .filter((item): item is (typeof navigation)[number] => Boolean(item))

export function MobileNav({ phone, phoneHref, email, emailHref, leadHref }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.classList.add('sheet-open')
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('sheet-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="mobile-nav">
      <button className="mobile-menu" type="button" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} onClick={() => setOpen(true)}>
        <Menu aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-drawer-backdrop"
            role="presentation"
            onMouseDown={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Мобильная навигация"
              onMouseDown={(event) => event.stopPropagation()}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: 18 }}
              transition={{ duration: 0.24 }}
            >
              <div className="drawer-head">
                <strong>Навигация</strong>
                <button type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)}>
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Мобильное меню">
                {mobileNavigation.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mobile-drawer-actions">
                <a href={phoneHref}>
                  <Phone size={17} aria-hidden="true" />
                  {phone}
                </a>
                <a href={emailHref}>
                  <Mail size={17} aria-hidden="true" />
                  {email}
                </a>
                <Link className="primary-action" href={leadHref} onClick={() => setOpen(false)}>
                  Запросить КП
                  <Send size={16} aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

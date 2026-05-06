'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { LeadForm, type ProductLeadContext } from '@/components/LeadForm'

type MobileProductCTAProps = {
  product: ProductLeadContext
}

export function MobileProductCTA({ product }: MobileProductCTAProps) {
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
    <>
      <div className="mobile-product-cta">
        <button type="button" className="primary-action" onClick={() => setOpen(true)}>
          Запросить цену
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="sheet-backdrop"
            role="presentation"
            onMouseDown={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bottom-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Запросить цену и наличие"
              onMouseDown={(event) => event.stopPropagation()}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.24 }}
            >
              <button className="sheet-close" type="button" aria-label="Закрыть форму" onClick={() => setOpen(false)}>
                <X size={20} aria-hidden="true" />
              </button>
              <LeadForm
                product={product}
                type="availability"
                title="Запросить цену и наличие"
                text="Товар уже выбран. Оставьте контакты, и менеджер уточнит условия."
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

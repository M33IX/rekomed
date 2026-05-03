'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type CookieConsentBannerProps = {
  enabled: boolean
  text: string
  policyPath: string
  yandexMetrikaId: string
}

type YandexMetrika = ((...args: unknown[]) => void) & { a?: unknown[] }

declare global {
  interface Window {
    ym?: YandexMetrika
  }
}

const COOKIE_CHOICE_KEY = 'cookieChoice'

const normalizeMetrikaId = (value: string) => value.replace(/[^\d]/g, '')

export function CookieConsentBanner({ enabled, text, policyPath, yandexMetrikaId }: CookieConsentBannerProps) {
  const [choice, setChoice] = useState<string | null>(null)
  const metrikaId = useMemo(() => normalizeMetrikaId(yandexMetrikaId), [yandexMetrikaId])

  useEffect(() => {
    if (!enabled) return
    setChoice(window.localStorage.getItem(COOKIE_CHOICE_KEY))
  }, [enabled])

  useEffect(() => {
    if (!enabled || choice !== 'accepted' || !metrikaId) return

    const scriptSrc = `https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}`
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement('script')
      script.async = true
      script.src = scriptSrc
      document.head.appendChild(script)
    }

    if (!window.ym) {
      const ymStub: YandexMetrika = (...args: unknown[]) => {
        ymStub.a?.push(args)
      }
      ymStub.a = []
      window.ym = ymStub
    } else {
      window.ym.a = window.ym.a || []
    }
    window.ym(Number(metrikaId), 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    })

    const handleLeadSubmitted = () => {
      window.ym?.(Number(metrikaId), 'reachGoal', 'lead_sent')
    }

    window.addEventListener('rekomed:lead-submitted', handleLeadSubmitted)
    return () => window.removeEventListener('rekomed:lead-submitted', handleLeadSubmitted)
  }, [choice, enabled, metrikaId])

  if (!enabled || choice === 'accepted' || choice === 'declined') return null

  const saveChoice = (value: 'accepted' | 'declined') => {
    window.localStorage.setItem(COOKIE_CHOICE_KEY, value)
    setChoice(value)
  }

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Настройки cookie">
      <p>
        {text}{' '}
        <Link href={policyPath}>
          Политика обработки персональных данных
        </Link>
      </p>
      <div className="cookie-consent-actions">
        <button type="button" onClick={() => saveChoice('accepted')}>
          Принять
        </button>
        <button type="button" onClick={() => saveChoice('declined')}>
          Отклонить
        </button>
      </div>
    </div>
  )
}

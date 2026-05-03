'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

export type ProductLeadContext = {
  id?: string
  title: string
  sku?: string
  path: string
  category?: string
}

type LeadFormProps = {
  product?: ProductLeadContext
  compact?: boolean
  title?: string
  text?: string
  successTitle?: string
  successText?: string
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function LeadForm({
  product,
  compact = false,
  title = 'Связаться с RekoMed',
  text = 'Оставьте контакты, и менеджер свяжется с вами по заявке.',
  successTitle = 'Заявка отправлена',
  successText = 'Менеджер свяжется с вами и уточнит детали запроса.'
}: LeadFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setState('loading')
    setError('')

    const form = new FormData(formElement)
    const payload = {
      type: 'callback',
      name: String(form.get('name') || ''),
      phone: String(form.get('phone') || ''),
      email: String(form.get('email') || ''),
      message: String(form.get('message') || ''),
      consent: form.get('consent') === 'on',
      companyWebsite: String(form.get('companyWebsite') || ''),
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      productId: product?.id || product?.sku || '',
      productTitle: product?.title || '',
      productSku: product?.sku || product?.id || '',
      productPath: product?.path || '',
      productCategory: product?.category || '',
      utm: Object.fromEntries(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''))
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Не удалось отправить заявку')
      }
      setState('success')
      window.dispatchEvent(new CustomEvent('rekomed:lead-submitted'))
      formElement.reset()
    } catch (cause) {
      setState('error')
      setError(cause instanceof Error ? cause.message : 'Не удалось отправить заявку')
    }
  }

  if (state === 'success') {
    return (
      <div className="form-success" role="status">
        <CheckCircle2 aria-hidden="true" />
        <div>
          <strong>{successTitle}</strong>
          <span>{successText}</span>
        </div>
      </div>
    )
  }

  return (
    <form className={compact ? 'lead-form compact' : 'lead-form'} onSubmit={submit}>
      <input name="companyWebsite" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="form-heading">
        <span>{title}</span>
        <p>{text}</p>
      </div>
      {product && (
        <div className="selected-product" aria-label="Выбранный товар">
          <span>Выбранный товар</span>
          <strong>{product.title}</strong>
          {(product.sku || product.category) && (
            <small>
              {[product.sku ? `Артикул ${product.sku}` : '', product.category].filter(Boolean).join(' · ')}
            </small>
          )}
        </div>
      )}
      <label>
        Имя
        <input name="name" required minLength={2} autoComplete="name" placeholder="Как к вам обращаться" />
      </label>
      <label>
        Телефон
        <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="+7..." />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" placeholder="Если удобно ответить на почту" />
      </label>
      {!compact && (
        <label>
          Комментарий
          <textarea name="message" rows={4} placeholder="Напишите вопрос, количество или дополнительные детали" />
        </label>
      )}
      <label className="checkbox-row">
        <input name="consent" type="checkbox" required />
        <span>
          Нажимая кнопку, я даю{' '}
          <Link href="/consent/" target="_blank">
            согласие на обработку персональных данных
          </Link>{' '}
          и подтверждаю ознакомление с{' '}
          <Link href="/privacy/" target="_blank">
            Политикой обработки персональных данных
          </Link>
        </span>
      </label>
      {state === 'error' && <p className="form-error">{error}</p>}
      <button className="primary-action" type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? <Loader2 className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
        Отправить заявку
      </button>
    </form>
  )
}

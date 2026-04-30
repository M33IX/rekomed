'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { leadTypes, type LeadType } from '@/lib/content'

type LeadFormProps = {
  type?: LeadType
  productId?: string
  compact?: boolean
  title?: string
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function LeadForm({ type = 'quote', productId, compact = false, title = 'Получить консультацию' }: LeadFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<LeadType>(type)

  const pageUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('loading')
    setError('')

    const form = new FormData(event.currentTarget)
    const payload = {
      type: selectedType,
      name: String(form.get('name') || ''),
      phone: String(form.get('phone') || ''),
      email: String(form.get('email') || ''),
      message: String(form.get('message') || ''),
      consent: form.get('consent') === 'on',
      companyWebsite: String(form.get('companyWebsite') || ''),
      productId,
      pageUrl,
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
      event.currentTarget.reset()
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
          <strong>Заявка отправлена</strong>
          <span>Менеджер свяжется с вами и уточнит детали запроса.</span>
        </div>
      </div>
    )
  }

  return (
    <form className={compact ? 'lead-form compact' : 'lead-form'} onSubmit={submit}>
      <input name="companyWebsite" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="form-heading">
        <span>{title}</span>
        <p>Ответим по наличию, документам и условиям поставки.</p>
      </div>
      <div className="segmented" role="group" aria-label="Тип заявки">
        {leadTypes.map((item) => (
          <button
            key={item.value}
            type="button"
            className={selectedType === item.value ? 'active' : ''}
            onClick={() => setSelectedType(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
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
        <input name="email" type="email" autoComplete="email" placeholder="Для КП или документов" />
      </label>
      {!compact && (
        <label>
          Комментарий
          <textarea name="message" rows={4} placeholder="Направление, артикул, спецификация или вопрос" />
        </label>
      )}
      <label className="checkbox-row">
        <input name="consent" type="checkbox" required />
        <span>Согласен(а) на обработку персональных данных</span>
      </label>
      {state === 'error' && <p className="form-error">{error}</p>}
      <button className="primary-action" type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? <Loader2 className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
        Отправить заявку
      </button>
    </form>
  )
}

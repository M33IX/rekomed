'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { z } from 'zod'
import type { LeadType } from '@/lib/content'

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
  type?: LeadType
  source?: 'home' | 'catalog' | 'product' | 'contacts' | 'documents'
  submitLabel?: string
  successTitle?: string
  successText?: string
}

type FormState = 'idle' | 'loading' | 'success' | 'error'
type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'message' | 'consent', string>>

const formSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя или как к вам обращаться'),
  phone: z.string().trim().min(7, 'Укажите телефон для связи'),
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email('Проверьте email').optional()
  ),
  message: z.string().trim().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Подтвердите согласие на обработку персональных данных' })
  }),
  companyWebsite: z.string().optional()
})

export function LeadForm({
  product,
  compact = false,
  title = 'Связаться с RekoMed',
  text = 'Оставьте контакты, и менеджер свяжется с вами по заявке.',
  type = product ? 'availability' : 'quote',
  source = product ? 'product' : 'contacts',
  submitLabel = product ? 'Отправить запрос' : 'Отправить заявку',
  successTitle = 'Заявка отправлена',
  successText = 'Менеджер свяжется с вами и уточнит цену, наличие, документы или детали запроса.'
}: LeadFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const reduced = useReducedMotion()

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)

    const validation = formSchema.safeParse({
      name: String(form.get('name') || ''),
      phone: String(form.get('phone') || ''),
      email: String(form.get('email') || ''),
      message: String(form.get('message') || ''),
      consent: form.get('consent') === 'on',
      companyWebsite: String(form.get('companyWebsite') || '')
    })

    if (!validation.success) {
      const errors: FieldErrors = {}
      for (const issue of validation.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && ['name', 'phone', 'email', 'message', 'consent'].includes(field)) {
          const errorField = field as keyof FieldErrors
          errors[errorField] ||= issue.message
        }
      }
      setFieldErrors(errors)
      const firstField = Object.keys(errors)[0]
      const firstInvalid = firstField ? formElement.querySelector<HTMLElement>(`[name="${firstField}"]`) : null
      firstInvalid?.focus()
      return
    }

    if (validation.data.companyWebsite) {
      setState('success')
      return
    }

    setState('loading')
    setError('')
    setFieldErrors({})

    const payload = {
      type,
      source,
      name: validation.data.name,
      phone: validation.data.phone,
      email: validation.data.email || '',
      message: validation.data.message || '',
      consent: validation.data.consent,
      companyWebsite: '',
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
      <motion.div
        className="form-success"
        role="status"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24 }}
      >
        <CheckCircle2 aria-hidden="true" />
        <div>
          <strong>{successTitle}</strong>
          <span>{successText}</span>
        </div>
      </motion.div>
    )
  }

  return (
    <form className={compact ? 'lead-form compact' : 'lead-form'} onSubmit={submit} noValidate>
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
        <span>Как к вам обращаться</span>
        <input
          name="name"
          autoComplete="name"
          placeholder="Имя"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? 'lead-name-error' : undefined}
        />
        {fieldErrors.name && <small id="lead-name-error" className="field-error">{fieldErrors.name}</small>}
      </label>
      <label>
        <span>Телефон</span>
        <input
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={fieldErrors.phone ? 'lead-phone-error' : undefined}
        />
        {fieldErrors.phone && <small id="lead-phone-error" className="field-error">{fieldErrors.phone}</small>}
      </label>
      <label>
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Если удобно ответить на почту"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'lead-email-error' : undefined}
        />
        {fieldErrors.email && <small id="lead-email-error" className="field-error">{fieldErrors.email}</small>}
      </label>
      {!compact && (
        <label>
          <span>Комментарий</span>
          <textarea
            name="message"
            rows={4}
            placeholder="Укажите изделие, артикул, количество или задачу"
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={fieldErrors.message ? 'lead-message-error' : undefined}
          />
          {fieldErrors.message && <small id="lead-message-error" className="field-error">{fieldErrors.message}</small>}
        </label>
      )}
      <label className="checkbox-row">
        <input
          name="consent"
          type="checkbox"
          aria-invalid={Boolean(fieldErrors.consent)}
          aria-describedby={fieldErrors.consent ? 'lead-consent-error' : undefined}
        />
        <span>
          Даю{' '}
          <Link href="/consent/" target="_blank">
            согласие на обработку персональных данных
          </Link>{' '}
          и принимаю{' '}
          <Link href="/privacy/" target="_blank">
            политику обработки
          </Link>
          .
          {fieldErrors.consent && <small id="lead-consent-error" className="field-error">{fieldErrors.consent}</small>}
        </span>
      </label>
      {state === 'error' && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action form-submit" type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? <Loader2 className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
        {state === 'loading' ? 'Отправляем...' : submitLabel}
      </button>
    </form>
  )
}

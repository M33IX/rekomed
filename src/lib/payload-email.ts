import nodemailer from 'nodemailer'
import type { EmailAdapter, SendEmailOptions } from 'payload'

const defaultFromAddress = process.env.SMTP_FROM_ADDRESS || process.env.SMTP_USER || 'noreply@reko-med.ru'
const defaultFromName = process.env.SMTP_FROM_NAME || 'RekoMed'

const getPort = () => {
  const port = Number(process.env.SMTP_PORT || 587)
  return Number.isFinite(port) ? port : 587
}

export const payloadEmailAdapter: EmailAdapter = ({ payload }) => {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const password = process.env.SMTP_PASSWORD

  if (!host) {
    return {
      name: 'rekomed-console-email',
      defaultFromAddress,
      defaultFromName,
      sendEmail: async (message: SendEmailOptions) => {
        payload.logger.info({
          msg: `Email adapter is in console mode. To: '${String(message.to || '')}', Subject: '${String(message.subject || '')}'`
        })
      }
    }
  }

  const transporter = nodemailer.createTransport({
    host,
    port: getPort(),
    secure: process.env.SMTP_SECURE === 'true',
    auth: user && password ? { user, pass: password } : undefined
  })

  return {
    name: 'rekomed-smtp',
    defaultFromAddress,
    defaultFromName,
    sendEmail: (message: SendEmailOptions) => transporter.sendMail(message)
  }
}

import Script from 'next/script'

type JivoChatWidgetProps = {
  enabled: boolean
  widgetId: string
}

export function JivoChatWidget({ enabled, widgetId }: JivoChatWidgetProps) {
  const safeWidgetId = widgetId.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!enabled || !safeWidgetId) return null

  return <Script src={`https://code.jivosite.com/widget/${safeWidgetId}`} strategy="afterInteractive" />
}

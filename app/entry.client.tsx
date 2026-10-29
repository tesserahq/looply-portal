import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import i18next from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { HydratedRouter } from 'react-router/dom'
import { fallbackLng, resources } from '@/modules/i18n/i18n'

async function main() {
  await i18next.use(initReactI18next).init({
    resources,
    lng: document.documentElement.lang,
    fallbackLng,
    interpolation: { escapeValue: false },
  })

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      </I18nextProvider>
    )
  })
}

main().catch((error) => console.error(error))

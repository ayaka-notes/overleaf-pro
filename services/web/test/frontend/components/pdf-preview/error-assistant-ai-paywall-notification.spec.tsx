import { FC, PropsWithChildren, useState } from 'react'
import { DetachCompileContext } from '@/shared/context/detach-compile-context'
import ErrorAssistantAiPaywallNotification from '@/features/pdf-preview/components/error-assistant-ai-paywall-notification'
import {
  EditorProviders,
  makeEditorProvider,
} from '../../helpers/editor-providers'

const PAYWALL_TEXT = 'You’ve reached the fair usage limit on your plan'

const futureDate = () => new Date(Date.now() + 60 * 60 * 1000)

function dispatchSuggestFixPaywall() {
  cy.window().then(win => {
    win.dispatchEvent(
      new CustomEvent('aiAssist:showPaywall', {
        detail: { origin: 'suggest-fix' },
      })
    )
  })
}

function makeShowLogsCompileProvider(initialShowLogs: boolean) {
  const Provider: FC<PropsWithChildren> = ({ children }) => {
    const [showLogs, setShowLogs] = useState(initialShowLogs)
    return (
      <DetachCompileContext.Provider value={{ showLogs, setShowLogs } as any}>
        <button
          type="button"
          data-testid="toggle-logs"
          onClick={() => setShowLogs(prev => !prev)}
        >
          toggle logs
        </button>
        {children}
      </DetachCompileContext.Provider>
    )
  }
  return Provider
}

function mountSuggestFixPaywall(initialShowLogs = true) {
  cy.window().then(win => {
    win.metaAttributesCache.set('ol-showAiFeatures', true)
  })

  cy.mount(
    <EditorProviders
      features={{ aiErrorAssistant: true }}
      providers={{
        EditorProvider: makeEditorProvider({
          hasSuggestionsLeft: false,
          premiumSuggestionResetDate: futureDate(),
        }),
        DetachCompileProvider: makeShowLogsCompileProvider(initialShowLogs),
      }}
    >
      <ErrorAssistantAiPaywallNotification />
    </EditorProviders>
  )
}

describe('<ErrorAssistantAiPaywallNotification />', function () {
  it('does not render the paywall before the suggest-fix paywall event fires', function () {
    mountSuggestFixPaywall()
    cy.contains(PAYWALL_TEXT).should('not.exist')
  })

  it('renders the paywall after the suggest-fix paywall event fires', function () {
    mountSuggestFixPaywall()
    dispatchSuggestFixPaywall()
    cy.contains(PAYWALL_TEXT).should('be.visible')
  })

  it('ignores paywall events from other origins', function () {
    mountSuggestFixPaywall()
    cy.window().then(win => {
      win.dispatchEvent(
        new CustomEvent('aiAssist:showPaywall', {
          detail: { origin: 'workbench' },
        })
      )
    })
    cy.contains(PAYWALL_TEXT).should('not.exist')
  })

  it('hides the paywall when the logs panel is closed', function () {
    mountSuggestFixPaywall()
    dispatchSuggestFixPaywall()
    cy.contains(PAYWALL_TEXT).should('be.visible')

    cy.findByTestId('toggle-logs').click()
    cy.contains(PAYWALL_TEXT).should('not.exist')
  })

  it('does not re-show the paywall when the logs panel is reopened', function () {
    mountSuggestFixPaywall()
    dispatchSuggestFixPaywall()
    cy.findByTestId('toggle-logs').click()
    cy.findByTestId('toggle-logs').click()
    cy.contains(PAYWALL_TEXT).should('not.exist')
  })
})

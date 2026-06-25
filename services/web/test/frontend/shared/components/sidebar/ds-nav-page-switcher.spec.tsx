import { DsNavPageSwitcher } from '../../../../../frontend/js/shared/components/sidebar/ds-nav-page-switcher'
import { SplitTestProvider } from '@/shared/context/split-test-context'
import { UserSettingsProvider } from '@/shared/context/user-settings-context'

function mountDsNavPageSwitcher(
  props: React.ComponentProps<typeof DsNavPageSwitcher>
) {
  cy.mount(
    <SplitTestProvider>
      <UserSettingsProvider>
        <DsNavPageSwitcher {...props} />
      </UserSettingsProvider>
    </SplitTestProvider>
  )
}

describe('<DsNavPageSwitcher />', function () {
  describe('activePage="library"', function () {
    beforeEach(function () {
      mountDsNavPageSwitcher({ activePage: 'library' })
    })

    it('marks the Library link as active', function () {
      cy.findByRole('link', { name: /library/i }).should('have.class', 'active')
    })

    it('does not mark the Projects link as active', function () {
      cy.findByRole('link', { name: /projects/i }).should(
        'not.have.class',
        'active'
      )
    })

    it('sets aria-current on the Library link', function () {
      cy.findByRole('link', { name: /library/i }).should(
        'have.attr',
        'aria-current',
        'page'
      )
    })

    it('does not set aria-current on the Projects link', function () {
      cy.findByRole('link', { name: /projects/i }).should(
        'not.have.attr',
        'aria-current'
      )
    })

    it('renders the logo', function () {
      cy.get('.ds-nav-page-switcher-logo img').should('exist')
    })
  })

  describe('activePage="projects"', function () {
    beforeEach(function () {
      mountDsNavPageSwitcher({ activePage: 'projects' })
    })

    it('marks the Projects link as active', function () {
      cy.findByRole('link', { name: /projects/i }).should(
        'have.class',
        'active'
      )
    })

    it('does not mark the Library link as active', function () {
      cy.findByRole('link', { name: /library/i }).should(
        'not.have.class',
        'active'
      )
    })

    it('renders the logo', function () {
      cy.get('.ds-nav-page-switcher-logo img').should('exist')
    })
  })

  describe('link hrefs', function () {
    beforeEach(function () {
      mountDsNavPageSwitcher({ activePage: 'library' })
    })

    it('Library link points to /library', function () {
      cy.findByRole('link', { name: /library/i }).should(
        'have.attr',
        'href',
        '/library'
      )
    })

    it('Projects link points to /project', function () {
      cy.findByRole('link', { name: /projects/i }).should(
        'have.attr',
        'href',
        '/project'
      )
    })
  })

  describe('showLogo={false}', function () {
    beforeEach(function () {
      mountDsNavPageSwitcher({ activePage: 'projects', showLogo: false })
    })

    it('does not render the logo', function () {
      cy.get('.ds-nav-page-switcher-logo').should('not.exist')
    })

    it('still renders both nav links', function () {
      cy.findByRole('link', { name: /library/i }).should('exist')
      cy.findByRole('link', { name: /projects/i }).should('exist')
    })
  })
})

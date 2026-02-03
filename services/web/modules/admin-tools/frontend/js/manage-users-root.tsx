import useWaitForI18n from '@/shared/hooks/use-wait-for-i18n'
import withErrorBoundary from '@/infrastructure/error-boundary'
import { GenericErrorBoundaryFallback } from '@/shared/components/generic-error-boundary-fallback'
import { SplitTestProvider } from '@/shared/context/split-test-context'
import { UserSettingsProvider } from '@/shared/context/user-settings-context'
import { UsersPageProvider, useUsersPageContext } from './users-page-context.tsx'
import { UserListProvider } from './user-list/context/user-list-context'
import UserListRoot from './user-list/components/user-list-root'
import { ProjectListProvider } from './project-list/context/project-list-context'
import ProjectListRoot from './project-list/components/project-list-root'

function UsersPageSelector() {
  const { page } = useUsersPageContext()

  if (page.type === 'projects') {
    return (
      <ProjectListProvider projectsOwnerId={page.userId}>
        <ProjectListRoot />
      </ProjectListProvider>
    )
  }
  return <UserListRoot />
}

function ManageUsersRoot() {
  const { isReady } = useWaitForI18n()

  if (!isReady) return null

  return (
    <SplitTestProvider>
      <UserSettingsProvider>
        <UsersPageProvider>
          <UserListProvider>
            <UsersPageSelector />
          </UserListProvider>
        </UsersPageProvider>
      </UserSettingsProvider>
    </SplitTestProvider>
  )
}

export default withErrorBoundary(ManageUsersRoot, () => (
  <GenericErrorBoundaryFallback />
))

import useWaitForI18n from '@/shared/hooks/use-wait-for-i18n'
import withErrorBoundary from '@/infrastructure/error-boundary'
import { GenericErrorBoundaryFallback } from '@/shared/components/generic-error-boundary-fallback'
import { SplitTestProvider } from '@/shared/context/split-test-context'
import { UserSettingsProvider } from '@/shared/context/user-settings-context'
import { UserListProvider } from './user-list/context/user-list-context'
import { ProjectListProvider } from './project-list/context/project-list-context'
import ProjectListRoot from './project-list/components/project-list-root'

function ManageProjectsRoot() {
  const { isReady } = useWaitForI18n()

  if (!isReady) return null

  return (
    <SplitTestProvider>
      <UserSettingsProvider>
        <UserListProvider>
          <ProjectListProvider projectsOwnerId={null}>
            <ProjectListRoot />
          </ProjectListProvider>
        </UserListProvider>
      </UserSettingsProvider>
    </SplitTestProvider>
  )
}

export default withErrorBoundary(ManageProjectsRoot, () => (
  <GenericErrorBoundaryFallback />
))


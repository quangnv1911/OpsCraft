import { FC, ReactNode } from 'react'
import { AppProvidersProps } from './AppProviders.type'
import ApiClientContextController from '@/context/apiClient/apiClientContextController/ApiClientContextController'
import AppIntegration from '@/integrations/AppIntegration'
import { GlobalLoading } from '@/components/common/global-loading'

const AppProviders: FC<AppProvidersProps> = ({
  children,
}: AppProvidersProps): ReactNode => {
  return (
    <AppIntegration>
      <ApiClientContextController>
        {children}
        <GlobalLoading />
      </ApiClientContextController>
    </AppIntegration>
  )
}

export default AppProviders

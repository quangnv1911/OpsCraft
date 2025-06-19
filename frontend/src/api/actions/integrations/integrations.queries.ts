import { queryFactoryOptions } from '@/api/utils/queryFactoryOptions'
import { IntegrationMutationResponse } from './integrations.type'
import { AxiosInstance } from 'axios'

export const testQueries = {
  all: () => ['test'],
  get: () =>
    queryFactoryOptions({
      queryKey: [...testQueries.all(), 'get'],
      queryFn: getAllIntegrations,
      enabled: true,
    }),
}

const getAllIntegrations = (client: AxiosInstance) => async () => {
  return (await client.get<IntegrationMutationResponse[]>('/integrations')).data
}

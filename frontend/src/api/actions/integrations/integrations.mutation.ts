import { AxiosInstance } from 'axios'
import {
  AddNewGitMutationArguments,
  IntegrationMutationResponse,
} from './integrations.type'

export const integrationMutations = {
  addNewGit:
    (client: AxiosInstance) => async (body: AddNewGitMutationArguments) => {
      return (await client.post<IntegrationMutationResponse>('/auth/login', body))
        .data
    },
  getAllIntegrations: (client: AxiosInstance) => async () => {
    return (
      await client.get<IntegrationMutationResponse[]>('/integrations')
    ).data
  },
}

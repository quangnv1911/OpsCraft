import { authMutations } from './auth/auth.mutations'
import { integrationMutations } from './integrations/integrations.mutation'

export const mutations = {
  ...authMutations,
  ...integrationMutations,
  // API_COLLECTION_MUTATIONS
} as const

export type AxiosMutationsType = typeof mutations

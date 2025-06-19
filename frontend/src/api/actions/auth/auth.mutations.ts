import { AxiosInstance } from 'axios'
import {
  LoginGoogleMutationArguments,
  LoginMutationArguments,
  LoginMutationResponse,
  LogoutMutationRequest,
  // MUTATION_TYPE_IMPORTS
} from './auth.types'
import { ENV } from '@/config/env'

export const authMutations = {
  loginMutation:
    (client: AxiosInstance) => async (body: LoginMutationArguments) => {
      return (await client.post<LoginMutationResponse>('/auth/login', body))
        .data
    },
  logoutMutation:
    (client: AxiosInstance) => async (body: LogoutMutationRequest) => {
      return (await client.post<void>('/auth/logout', body)).data
    },
  loginGoogleMutation:
    (client: AxiosInstance) => async (body: LoginGoogleMutationArguments) => {
      return (
        await client.post<LoginMutationResponse>(
          '/auth/login-google',
          body
        )
      ).data
    },
  // MUTATION_FUNCTIONS_SETUP
}

export const refreshTokenUrl = `${ENV.BACK_END_URL}/users/refresh-token`

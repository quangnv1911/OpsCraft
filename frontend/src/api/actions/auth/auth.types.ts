export type LoginMutationArguments = {
  email: string
  password: string
  isRememberMe: boolean
}

export type LoginMutationResponse = {
  accessToken: string
  refreshToken: string
  isAuthenticated: boolean
}

export type GetMeQueryResponse = {
  firstName: string
  lastName: string
  userName: string
}

export type User = {
  id: string
  name: string
}

export type GetUsersResponse = {
  users: User[]
  nextPage?: number | null
}

export type GetUsersInfiniteArgs = {
  count?: string
}

export type GetUsersListArgs = {
  page?: string
}

export type RefreshTokenMutationResponse = {
  accessToken: string
  refreshToken: string
}

export type RegisterMutationArguments = {
  userName: string
  password: string
  email: string
  captchaText: string
  captchaId?: number
}

export type LogoutMutationRequest = {
  accessToken: string
}

// API_ACTION_TYPES

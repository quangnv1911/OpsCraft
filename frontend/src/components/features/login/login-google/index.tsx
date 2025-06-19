import { LoginMutationResponse } from '@/api/actions/auth/auth.types'
import { StandardizedApiError } from '@/context/apiClient/apiClientContextController/apiError/apiError.types'
import { useMutation } from '@/hooks/useMutation/useMutation'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'
import { toast } from 'react-toastify'
import authStore from '@/stores/authStore'
import { useGlobalLoading } from '@/hooks/useGlobalLoading'
import { useRouter } from '@tanstack/react-router'

export const LoginGoogle = () => {
  const router = useRouter()
  const { setAuthData } = authStore()
  const { showLoading, hideLoading } = useGlobalLoading()

  const { mutateAsync: loginGoogleMutate } = useMutation(
    'loginGoogleMutation',
    {
      onSuccess: (res: LoginMutationResponse) => {
        console.log('res', res)
        setAuthData(true, res.accessToken, res.refreshToken)
        hideLoading()
        toast.success('Đăng nhập thành công')
        router.navigate({ to: '/home' })
      },
      onError: (error: StandardizedApiError) => {
        hideLoading()
        toast.error(error.message)
      },
    }
  )
  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async codeResponse => {
      console.log(codeResponse)
      showLoading()
      await loginGoogleMutate({ code: codeResponse.code })
    },
    onError: errorResponse => {
      hideLoading()
      toast.error(errorResponse.error_description)
    },
  })

  return (
    <GoogleLogin
      width="100%"
      theme="outline"
      shape="pill"
      logo_alignment="center"
      size="large"
      onSuccess={googleLogin}
      // onSuccess={data => {
      //   console.log(data)
      // }}
    />
  )
}

import type React from 'react'

import { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Zap } from 'lucide-react'
import { toast } from 'react-toastify'
import { Link, useRouter } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginFormData, loginSchema } from '@/schema/loginSchema'
import { useForm } from 'react-hook-form'
import { useMutation } from '@/hooks/useMutation/useMutation'
import { LoginMutationResponse } from '@/api/actions/auth/auth.types'
import authStore from '@/stores/authStore'
import { StandardizedApiError } from '@/context/apiClient/apiClientContextController/apiError/apiError.types'
import { LoginGoogle } from '@/components/features/login/login-google'
import { useGlobalLoading } from '@/hooks/useGlobalLoading'

export const LoginPage = (): ReactNode => {
  const router = useRouter()
  const { setAuthData } = authStore()
  const { showLoading, hideLoading } = useGlobalLoading()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      isRememberMe: false,
    },
  })

  const { mutateAsync: loginMutate, isPending: isAuthenticating } = useMutation(
    'loginMutation',
    {
      onSuccess: (res: LoginMutationResponse) => {
        toast.success('Login successful')
        setAuthData(true, res.accessToken, res.refreshToken)
        hideLoading()
        router.navigate({ to: '/home' })
      },
      onError: (error: StandardizedApiError) => {
        hideLoading()
        toast.error(error.message)
      },
    }
  )
  const onSubmit = async (data: LoginFormData) => {
    showLoading()
    await loginMutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">PipelineFlow</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="#" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" {...register('isRememberMe')} />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting || isAuthenticating ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <LoginGoogle />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link to="#" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

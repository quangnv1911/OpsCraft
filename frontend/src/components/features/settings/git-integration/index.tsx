import {
  AddNewGitMutationArguments,
  AddNewGitMutationResponse,
} from '@/api/actions/integrations/integrations.type'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StandardizedApiError } from '@/context/apiClient/apiClientContextController/apiError/apiError.types'
import { useGlobalLoading } from '@/hooks/useGlobalLoading'
import { useMutation } from '@/hooks/useMutation/useMutation'
import { Eye, EyeOff, Copy, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'

interface GitIntegrationProps {
  mode: 'create' | 'update'
  initialData?: Partial<AddNewGitMutationArguments>
  onSuccess?: (data: AddNewGitMutationResponse) => void
}

const PLATFORM_OPTIONS = [
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
  { value: 'gitbucket', label: 'GitBucket' },
]

export const GitIntegration = ({
  mode,
  initialData,
  onSuccess,
}: GitIntegrationProps) => {
  const { showLoading, hideLoading } = useGlobalLoading()
  const [showToken, setShowToken] = useState(false)

  const [formData, setFormData] = useState<AddNewGitMutationArguments>({
    name: initialData?.name || '',
    user_name: initialData?.user_name || '',
    token: initialData?.token || '',
    platform: initialData?.platform || 'github',
  })

  const { mutateAsync: addNewGit } = useMutation('addNewGit', {
    onSuccess: (res: AddNewGitMutationResponse) => {
      hideLoading()
      toast.success(
        mode === 'create'
          ? 'Git integration created successfully'
          : 'Git integration updated successfully'
      )
      onSuccess?.(res)
    },
    onError: (error: StandardizedApiError) => {
      hideLoading()
      toast.error(error.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!formData.user_name.trim()) {
      toast.error('Username is required')
      return
    }
    if (!formData.token.trim()) {
      toast.error('Token is required')
      return
    }

    showLoading(`${mode === 'create' ? 'Creating' : 'Updating'} integration...`)
    await addNewGit(formData)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const handleInputChange = (
    field: keyof AddNewGitMutationArguments,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Platform Selection */}
      <div>
        <Label htmlFor="platform">Platform *</Label>
        <Select
          value={formData.platform}
          onValueChange={value => handleInputChange('platform', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Integration Name */}
      <div>
        <Label htmlFor="name">Integration Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => handleInputChange('name', e.target.value)}
          placeholder="e.g., My GitHub Integration"
          required
        />
      </div>

      {/* Username */}
      <div>
        <Label htmlFor="user_name">Username *</Label>
        <Input
          id="user_name"
          value={formData.user_name}
          onChange={e => handleInputChange('user_name', e.target.value)}
          placeholder="e.g., john_doe"
          required
        />
      </div>

      {/* Access Token */}
      <div>
        <Label htmlFor="token">Personal Access Token *</Label>
        <div className="flex gap-2">
          <Input
            id="token"
            type={showToken ? 'text' : 'password'}
            value={formData.token}
            onChange={e => handleInputChange('token', e.target.value)}
            placeholder="Enter your access token"
            required
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowToken(!showToken)}
          >
            {showToken ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          {formData.token && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(formData.token)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Generate a token with appropriate permissions from your{' '}
          {formData.platform} settings
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {mode === 'create' ? 'Create Integration' : 'Update Integration'}
        </Button>
      </div>
    </form>
  )
}

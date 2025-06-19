import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Github,
  Cloud,
  Key,
  Server,
  Bell,
  Shield,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  GitBranch,
  Database,
  Webhook,
  SettingsIcon,
  Globe,
  Users,
  Mail,
  Smartphone,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'react-toastify'
import { GitIntegration } from '@/components/features/settings/git-integration'
import { AddNewGitMutationResponse } from '@/api/actions/integrations/integrations.type'

export interface Integration {
  id: string
  name: string
  type:
    | 'github'
    | 'gitlab'
    | 'jenkins'
    | 'docker'
    | 'aws'
    | 'gcp'
    | 'azure'
    | 'database'
    | 'slack'
    | 'discord'
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  lastSync: string
  config?: Record<string, any>
  description: string
  icon: any
}

interface CloudProvider {
  id: string
  name: string
  type: 'aws' | 'gcp' | 'azure'
  status: 'connected' | 'disconnected'
  region: string
  services: string[]
  credentials?: {
    accessKey?: string
    secretKey?: string
    projectId?: string
    serviceAccount?: string
  }
}

interface NotificationChannel {
  id: string
  type: 'email' | 'slack' | 'discord' | 'webhook' | 'sms'
  name: string
  enabled: boolean
  config: Record<string, any>
}

const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'GitHub Organization',
    type: 'github',
    status: 'connected',
    lastSync: '2 minutes ago',
    description: 'Connect to GitHub repositories and manage workflows',
    icon: Github,
    config: {
      organization: 'my-org',
      accessToken: 'ghp_****',
      webhookUrl: 'https://api.github.com/webhooks',
    },
  },
  {
    id: '2',
    name: 'GitLab Enterprise',
    type: 'gitlab',
    status: 'connected',
    lastSync: '5 minutes ago',
    description: 'GitLab CI/CD integration for enterprise projects',
    icon: GitBranch,
    config: {
      baseUrl: 'https://gitlab.company.com',
      accessToken: 'glpat-****',
      projectId: '123',
    },
  },
  {
    id: '3',
    name: 'Jenkins Server',
    type: 'jenkins',
    status: 'error',
    lastSync: '1 hour ago',
    description: 'Jenkins automation server for CI/CD pipelines',
    icon: SettingsIcon,
    config: {
      serverUrl: 'https://jenkins.company.com',
      username: 'admin',
      apiToken: '****',
    },
  },
  {
    id: '4',
    name: 'Docker Registry',
    type: 'docker',
    status: 'connected',
    lastSync: '10 minutes ago',
    description: 'Private Docker registry for container images',
    icon: Database,
    config: {
      registryUrl: 'registry.company.com',
      username: 'docker-user',
      password: '****',
    },
  },
  {
    id: '5',
    name: 'Slack Notifications',
    type: 'slack',
    status: 'pending',
    lastSync: 'Never',
    description: 'Send pipeline notifications to Slack channels',
    icon: Bell,
    config: {
      webhookUrl: '',
      channel: '#deployments',
    },
  },
]

const mockCloudProviders: CloudProvider[] = [
  {
    id: '1',
    name: 'AWS Production',
    type: 'aws',
    status: 'connected',
    region: 'us-east-1',
    services: ['EC2', 'Lambda', 'S3', 'RDS', 'CloudFront', 'API Gateway'],
    credentials: {
      accessKey: 'AKIA****',
      secretKey: '****',
    },
  },
  {
    id: '2',
    name: 'Google Cloud Dev',
    type: 'gcp',
    status: 'connected',
    region: 'us-central1',
    services: ['App Engine', 'Cloud Functions', 'Cloud Storage', 'Cloud SQL'],
    credentials: {
      projectId: 'my-project-dev',
      serviceAccount: 'service-account@my-project.iam.gserviceaccount.com',
    },
  },
  {
    id: '3',
    name: 'Azure Staging',
    type: 'azure',
    status: 'disconnected',
    region: 'East US',
    services: [],
    credentials: {},
  },
]

const mockNotificationChannels: NotificationChannel[] = [
  {
    id: '1',
    type: 'email',
    name: 'Email Notifications',
    enabled: true,
    config: {
      recipients: ['admin@company.com', 'dev-team@company.com'],
      events: ['pipeline_success', 'pipeline_failure', 'deployment_complete'],
    },
  },
  {
    id: '2',
    type: 'slack',
    name: 'Dev Team Slack',
    enabled: true,
    config: {
      webhookUrl: 'https://hooks.slack.com/services/****',
      channel: '#deployments',
      events: ['pipeline_failure', 'deployment_complete'],
    },
  },
  {
    id: '3',
    type: 'webhook',
    name: 'Custom Webhook',
    enabled: false,
    config: {
      url: 'https://api.company.com/webhooks/pipeline',
      secret: 'webhook-secret',
      events: ['all'],
    },
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'connected':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'disconnected':
      return <XCircle className="h-4 w-4 text-gray-500" />
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'pending':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    default:
      return <XCircle className="h-4 w-4 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  const colors = {
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <Badge className={colors[status as keyof typeof colors]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export const SettingsPage = () => {
  const [integrations, setIntegrations] =
    useState<Integration[]>(mockIntegrations)
  const [cloudProviders, setCloudProviders] =
    useState<CloudProvider[]>(mockCloudProviders)
  const [notificationChannels, setNotificationChannels] = useState<
    NotificationChannel[]
  >(mockNotificationChannels)
  const [selfHosted, setSelfHosted] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isAddingIntegration, setIsAddingIntegration] = useState(false)
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<
    string | null
  >(null)
  const [isGitIntegrationOpen, setIsGitIntegrationOpen] = useState(false)

  const handleSaveSettings = () => {
    toast.success('Your settings have been updated successfully.')
  }

  const handleTestConnection = (id: string, type: 'integration' | 'cloud') => {
    toast.info('Connection test initiated...')

    // Simulate connection test
    setTimeout(() => {
      if (type === 'integration') {
        setIntegrations(prev =>
          prev.map(item =>
            item.id === id
              ? { ...item, status: 'connected' as const, lastSync: 'Just now' }
              : item
          )
        )
      } else {
        setCloudProviders(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status: 'connected' as const } : item
          )
        )
      }

      toast.success('Connection test completed successfully.')
    }, 2000)
  }

  const handleDeleteIntegration = (id: string) => {
    setIntegrations(prev => prev.filter(item => item.id !== id))
    toast.success('Integration has been successfully removed.')
  }

  const handleToggleNotificationChannel = (id: string) => {
    setNotificationChannels(prev =>
      prev.map(channel =>
        channel.id === id ? { ...channel, enabled: !channel.enabled } : channel
      )
    )
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('The value has been copied to your clipboard.')
  }

  const handleIntegrationSelect = (integrationType: string) => {
    if (integrationType === 'git') {
      setSelectedIntegrationType(integrationType)
      setIsAddingIntegration(false)
      setIsGitIntegrationOpen(true)
    } else {
      // Handle other integration types here
      toast.info(`${integrationType} integration coming soon!`)
    }
  }

  const handleGitIntegrationSuccess = (data: AddNewGitMutationResponse) => {
    // Add the new integration to the list
    const newIntegration: Integration = {
      id: data.id || Date.now().toString(),
      name: data.name || 'Git Integration',
      type: (data.platform as Integration['type']) || 'github',
      status: 'connected',
      lastSync: 'Just now',
      description: `${data.platform} integration`,
      icon: data.platform === 'gitlab' ? GitBranch : Github,
      config: {
        name: data.name,
        user_name: data.user_name,
        platform: data.platform,
      },
    }

    setIntegrations(prev => [...prev, newIntegration])
    setIsGitIntegrationOpen(false)
    setSelectedIntegrationType(null)
    toast.success('Git integration added successfully!')
  }

  const renderIntegrationConfig = (integration: Integration) => {
    const Icon = integration.icon
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="h-3 w-3 mr-1" />
            Configure
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Configure {integration.name}
            </DialogTitle>
            <DialogDescription>{integration.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {integration.type === 'github' && (
              <>
                <div>
                  <Label htmlFor="github-org">Organization</Label>
                  <Input
                    id="github-org"
                    defaultValue={integration.config?.organization}
                  />
                </div>
                <div>
                  <Label htmlFor="github-token">Personal Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="github-token"
                      type={showSecrets['github-token'] ? 'text' : 'password'}
                      defaultValue={integration.config?.accessToken}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSecretVisibility('github-token')}
                    >
                      {showSecrets['github-token'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(integration.config?.accessToken || '')
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="github-webhook">Webhook URL</Label>
                  <Input
                    id="github-webhook"
                    defaultValue={integration.config?.webhookUrl}
                  />
                </div>
              </>
            )}

            {integration.type === 'gitlab' && (
              <>
                <div>
                  <Label htmlFor="gitlab-url">GitLab Base URL</Label>
                  <Input
                    id="gitlab-url"
                    defaultValue={integration.config?.baseUrl}
                  />
                </div>
                <div>
                  <Label htmlFor="gitlab-token">Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gitlab-token"
                      type={showSecrets['gitlab-token'] ? 'text' : 'password'}
                      defaultValue={integration.config?.accessToken}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSecretVisibility('gitlab-token')}
                    >
                      {showSecrets['gitlab-token'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="gitlab-project">Project ID</Label>
                  <Input
                    id="gitlab-project"
                    defaultValue={integration.config?.projectId}
                  />
                </div>
              </>
            )}

            {integration.type === 'jenkins' && (
              <>
                <div>
                  <Label htmlFor="jenkins-url">Jenkins Server URL</Label>
                  <Input
                    id="jenkins-url"
                    defaultValue={integration.config?.serverUrl}
                  />
                </div>
                <div>
                  <Label htmlFor="jenkins-username">Username</Label>
                  <Input
                    id="jenkins-username"
                    defaultValue={integration.config?.username}
                  />
                </div>
                <div>
                  <Label htmlFor="jenkins-token">API Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="jenkins-token"
                      type={showSecrets['jenkins-token'] ? 'text' : 'password'}
                      defaultValue={integration.config?.apiToken}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSecretVisibility('jenkins-token')}
                    >
                      {showSecrets['jenkins-token'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {integration.type === 'slack' && (
              <>
                <div>
                  <Label htmlFor="slack-webhook">Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slack-webhook"
                      type={showSecrets['slack-webhook'] ? 'text' : 'password'}
                      defaultValue={integration.config?.webhookUrl}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSecretVisibility('slack-webhook')}
                    >
                      {showSecrets['slack-webhook'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="slack-channel">Default Channel</Label>
                  <Input
                    id="slack-channel"
                    defaultValue={integration.config?.channel}
                    placeholder="#deployments"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button onClick={() => toast.success('Configuration saved!')}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="integrations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="cloud">Cloud Providers</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="integrations" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Integrations</h2>
                  <p className="text-muted-foreground">
                    Connect your tools and services to streamline your workflow
                  </p>
                </div>
                <Dialog
                  open={isAddingIntegration}
                  onOpenChange={setIsAddingIntegration}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Integration
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Integration</DialogTitle>
                      <DialogDescription>
                        Choose a service to integrate with your pipeline
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          type: 'git',
                          name: 'Git',
                          icon: GitBranch,
                          description: 'Source code management',
                        },
                        {
                          type: 'jenkins',
                          name: 'Jenkins',
                          icon: SettingsIcon,
                          description: 'Automation server',
                        },
                        {
                          type: 'docker',
                          name: 'Docker',
                          icon: Database,
                          description: 'Container registry',
                        },
                        {
                          type: 'slack',
                          name: 'Slack',
                          icon: Bell,
                          description: 'Team communication',
                        },
                        {
                          type: 'discord',
                          name: 'Discord',
                          icon: Bell,
                          description: 'Community platform',
                        },
                      ].map(service => {
                        const Icon = service.icon
                        return (
                          <Card
                            key={service.type}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() =>
                              handleIntegrationSelect(service.type)
                            }
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Icon className="h-8 w-8" />
                                <div>
                                  <h3 className="font-medium">
                                    {service.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {service.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {integrations.map(integration => {
                  const Icon = integration.icon
                  return (
                    <Card key={integration.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-lg">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">
                                  {integration.name}
                                </h3>
                                {getStatusIcon(integration.status)}
                                {getStatusBadge(integration.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {integration.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last sync: {integration.lastSync}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleTestConnection(
                                  integration.id,
                                  'integration'
                                )
                              }
                            >
                              Test
                            </Button>
                            {renderIntegrationConfig(integration)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteIntegration(integration.id)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="cloud" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Cloud Providers</h2>
                  <p className="text-muted-foreground">
                    Manage your cloud infrastructure connections
                  </p>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cloud Provider
                </Button>
              </div>

              <div className="grid gap-6">
                {cloudProviders.map(provider => (
                  <Card key={provider.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Cloud className="h-6 w-6" />
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {provider.name}
                              {getStatusIcon(provider.status)}
                              {getStatusBadge(provider.status)}
                            </CardTitle>
                            <CardDescription>
                              {provider.type.toUpperCase()} • {provider.region}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleTestConnection(provider.id, 'cloud')
                            }
                          >
                            Test Connection
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {provider.services.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">
                              Connected Services
                            </Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {provider.services.map(service => (
                                <Badge key={service} variant="secondary">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">
                              Region
                            </Label>
                            <Select defaultValue={provider.region}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="us-east-1">
                                  US East (N. Virginia)
                                </SelectItem>
                                <SelectItem value="us-west-2">
                                  US West (Oregon)
                                </SelectItem>
                                <SelectItem value="eu-west-1">
                                  Europe (Ireland)
                                </SelectItem>
                                <SelectItem value="ap-southeast-1">
                                  Asia Pacific (Singapore)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              Environment
                            </Label>
                            <Select defaultValue="production">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="development">
                                  Development
                                </SelectItem>
                                <SelectItem value="staging">Staging</SelectItem>
                                <SelectItem value="production">
                                  Production
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {provider.credentials && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              Credentials
                            </Label>
                            {provider.type === 'aws' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="aws-access-key">
                                    Access Key ID
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id="aws-access-key"
                                      type={
                                        showSecrets['aws-access']
                                          ? 'text'
                                          : 'password'
                                      }
                                      defaultValue={
                                        provider.credentials.accessKey
                                      }
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        toggleSecretVisibility('aws-access')
                                      }
                                    >
                                      {showSecrets['aws-access'] ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="aws-secret-key">
                                    Secret Access Key
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id="aws-secret-key"
                                      type={
                                        showSecrets['aws-secret']
                                          ? 'text'
                                          : 'password'
                                      }
                                      defaultValue={
                                        provider.credentials.secretKey
                                      }
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        toggleSecretVisibility('aws-secret')
                                      }
                                    >
                                      {showSecrets['aws-secret'] ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {provider.type === 'gcp' && (
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="gcp-project">
                                    Project ID
                                  </Label>
                                  <Input
                                    id="gcp-project"
                                    defaultValue={
                                      provider.credentials.projectId
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="gcp-service-account">
                                    Service Account
                                  </Label>
                                  <Input
                                    id="gcp-service-account"
                                    defaultValue={
                                      provider.credentials.serviceAccount
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Notification Settings</h2>
                <p className="text-muted-foreground">
                  Configure how and when you receive notifications
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Channels</CardTitle>
                  <CardDescription>
                    Manage your notification delivery methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationChannels.map(channel => {
                    const icons = {
                      email: Mail,
                      slack: Bell,
                      discord: Bell,
                      webhook: Webhook,
                      sms: Smartphone,
                    }
                    const Icon = icons[channel.type]

                    return (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{channel.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {channel.type === 'email' &&
                                `${channel.config.recipients?.length || 0} recipients`}
                              {channel.type === 'slack' &&
                                `Channel: ${channel.config.channel}`}
                              {channel.type === 'webhook' &&
                                `URL: ${channel.config.url}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={() =>
                              handleToggleNotificationChannel(channel.id)
                            }
                          />
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Notification Channel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Preferences</CardTitle>
                  <CardDescription>
                    Choose which events trigger notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      event: 'pipeline_started',
                      label: 'Pipeline Started',
                      description: 'When a pipeline begins execution',
                    },
                    {
                      event: 'pipeline_success',
                      label: 'Pipeline Success',
                      description: 'When a pipeline completes successfully',
                    },
                    {
                      event: 'pipeline_failure',
                      label: 'Pipeline Failure',
                      description: 'When a pipeline fails',
                    },
                    {
                      event: 'deployment_complete',
                      label: 'Deployment Complete',
                      description: 'When a deployment finishes',
                    },
                    {
                      event: 'security_alert',
                      label: 'Security Alerts',
                      description: 'Security-related notifications',
                    },
                  ].map(item => (
                    <div
                      key={item.event}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <Label className="font-medium">{item.label}</Label>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <Switch
                        defaultChecked={item.event !== 'pipeline_started'}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Security Settings</h2>
                <p className="text-muted-foreground">
                  Manage security policies and access controls
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys & Secrets Management
                  </CardTitle>
                  <CardDescription>
                    Centralized management of all API keys and secrets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="encryption-key">
                        Master Encryption Key
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="encryption-key"
                          type={showSecrets['master-key'] ? 'text' : 'password'}
                          placeholder="Enter master encryption key"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSecretVisibility('master-key')}
                        >
                          {showSecrets['master-key'] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="key-rotation">Key Rotation Period</Label>
                      <Select defaultValue="90">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="encrypt-secrets">
                        Encrypt Secrets at Rest
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        All secrets will be encrypted using AES-256
                      </p>
                    </div>
                    <Switch id="encrypt-secrets" defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audit-logs">Enable Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Log all access to sensitive resources
                      </p>
                    </div>
                    <Switch id="audit-logs" defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">
                        Require Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enforce 2FA for all users
                      </p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ip-whitelist">IP Address Whitelist</Label>
                      <p className="text-sm text-muted-foreground">
                        Restrict access to specific IP addresses
                      </p>
                    </div>
                    <Switch id="ip-whitelist" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="session-timeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      defaultValue="60"
                      min="15"
                      max="480"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-policy">Password Policy</Label>
                    <Select defaultValue="strong">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">
                          Basic (8+ characters)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium (8+ chars, mixed case)
                        </SelectItem>
                        <SelectItem value="strong">
                          Strong (12+ chars, mixed case, numbers, symbols)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">General Settings</h2>
                <p className="text-muted-foreground">
                  Configure general application preferences
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Application Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="UTC">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time
                          </SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select defaultValue="MM/DD/YYYY">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Deployment Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="self-hosted">Self-Hosted Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Run PipelineFlow on your own infrastructure
                      </p>
                    </div>
                    <Switch
                      id="self-hosted"
                      checked={selfHosted}
                      onCheckedChange={setSelfHosted}
                    />
                  </div>
                  {selfHosted && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="server-url">Server URL</Label>
                          <Input
                            id="server-url"
                            placeholder="https://your-server.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="api-endpoint">API Endpoint</Label>
                          <Input id="api-endpoint" placeholder="/api/v1" />
                        </div>
                        <div>
                          <Label htmlFor="webhook-url">Webhook URL</Label>
                          <Input
                            id="webhook-url"
                            placeholder="https://your-server.com/webhooks"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ssl-cert">SSL Certificate</Label>
                          <Textarea
                            id="ssl-cert"
                            placeholder="-----BEGIN CERTIFICATE-----"
                            rows={4}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="max-concurrent">
                      Max Concurrent Pipelines
                    </Label>
                    <Input
                      id="max-concurrent"
                      type="number"
                      defaultValue="5"
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="log-retention">Log Retention (days)</Label>
                    <Input
                      id="log-retention"
                      type="number"
                      defaultValue="30"
                      min="1"
                      max="365"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeout">
                      Default Pipeline Timeout (minutes)
                    </Label>
                    <Input
                      id="timeout"
                      type="number"
                      defaultValue="60"
                      min="5"
                      max="480"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cache-size">Build Cache Size (GB)</Label>
                    <Input
                      id="cache-size"
                      type="number"
                      defaultValue="10"
                      min="1"
                      max="100"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup & Recovery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-backup">Automatic Backups</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically backup configurations and data
                      </p>
                    </div>
                    <Switch id="auto-backup" defaultChecked />
                  </div>
                  <div>
                    <Label htmlFor="backup-frequency">Backup Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="backup-location">Backup Location</Label>
                    <Input
                      id="backup-location"
                      placeholder="s3://my-bucket/backups"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Git Integration Dialog */}
      <Dialog
        open={isGitIntegrationOpen}
        onOpenChange={setIsGitIntegrationOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configure{' '}
              {selectedIntegrationType === 'github' ? 'GitHub' : 'GitLab'}{' '}
              Integration
            </DialogTitle>
            <DialogDescription>
              Add a new {selectedIntegrationType} integration to connect your
              repositories
            </DialogDescription>
          </DialogHeader>
          <GitIntegration
            mode="create"
            initialData={{ platform: selectedIntegrationType || 'github' }}
            onSuccess={handleGitIntegrationSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

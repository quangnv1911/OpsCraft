import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Integration } from '@/pages/settings'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Copy,
  Database,
  Edit,
  Eye,
  EyeOff,
  GitBranch,
  GitBranchIcon,
  Github,
  Plus,
  SettingsIcon,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Fragment, ReactNode, useState } from 'react'
import { toast } from 'react-toastify'
import { GitIntegration } from '../git-integration'
import { AddNewGitMutationResponse } from '@/api/actions/integrations/integrations.type'

const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'GitHub Organization',
    type: 'github',
    status: 'connected',
    lastSync: '2 minutes ago',
    description: 'Connect to GitHub repositories and manage workflows',
    icon: GitBranchIcon,
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

interface TabIntegrationsProps {}

export const TabIntegrations = ({}: TabIntegrationsProps): ReactNode => {
  const [isAddingIntegration, setIsAddingIntegration] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isGitIntegrationOpen, setIsGitIntegrationOpen] = useState(false)

  const [selectedIntegrationType, setSelectedIntegrationType] = useState<
    string | null
  >(null)

  const [integrations, setIntegrations] =
    useState<Integration[]>(mockIntegrations)
  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
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

  const handleIntegrationSelect = (integrationType: string) => {
    if (integrationType === 'git') {
      console.log('integrationType', integrationType)
      setSelectedIntegrationType(integrationType)
      setIsAddingIntegration(false)
      setIsGitIntegrationOpen(true)
    } else {
      // Handle other integration types here
      toast.info(`${integrationType} integration coming soon!`)
    }
  }

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('The value has been copied to your clipboard.')
  }

  const handleTestConnection = (id: string, type: 'integration' | 'cloud') => {
    toast.info('Connection test initiated...')

    // Simulate connection test
    setTimeout(() => {
      setIntegrations(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, status: 'connected' as const, lastSync: 'Just now' }
            : item
        )
      )

      toast.success('Connection test completed successfully.')
    }, 2000)
  }

  const handleDeleteIntegration = (id: string) => {
    setIntegrations(prev => prev.filter(item => item.id !== id))
    toast.success('Integration has been successfully removed.')
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
    <Fragment>
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
                      onClick={() => handleIntegrationSelect(service.type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-8 w-8" />
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
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
                          <h3 className="font-medium">{integration.name}</h3>
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
                          handleTestConnection(integration.id, 'integration')
                        }
                      >
                        Test
                      </Button>
                      {renderIntegrationConfig(integration)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteIntegration(integration.id)}
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
    </Fragment>
  )
}

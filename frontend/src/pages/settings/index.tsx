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
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
} from 'lucide-react'
import { toast } from 'react-toastify'
import { Header } from '@/layout/header'

interface Integration {
  id: string
  name: string
  type: 'github' | 'cloud' | 'database'
  status: 'connected' | 'disconnected' | 'error'
  lastSync: string
}

interface CloudProvider {
  id: string
  name: string
  type: 'aws' | 'gcp' | 'azure'
  status: 'connected' | 'disconnected'
  region: string
  services: string[]
}

const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'GitHub Organization',
    type: 'github',
    status: 'connected',
    lastSync: '2 minutes ago',
  },
  {
    id: '2',
    name: 'Production Database',
    type: 'database',
    status: 'connected',
    lastSync: '5 minutes ago',
  },
  {
    id: '3',
    name: 'Jenkins Server',
    type: 'github',
    status: 'error',
    lastSync: '1 hour ago',
  },
]

const mockCloudProviders: CloudProvider[] = [
  {
    id: '1',
    name: 'AWS Production',
    type: 'aws',
    status: 'connected',
    region: 'us-east-1',
    services: ['EC2', 'Lambda', 'S3', 'RDS'],
  },
  {
    id: '2',
    name: 'Google Cloud Dev',
    type: 'gcp',
    status: 'connected',
    region: 'us-central1',
    services: ['App Engine', 'Cloud Functions', 'Cloud Storage'],
  },
  {
    id: '3',
    name: 'Azure Staging',
    type: 'azure',
    status: 'disconnected',
    region: 'East US',
    services: [],
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
    default:
      return <XCircle className="h-4 w-4 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  const colors = {
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
  }

  return (
    <Badge className={colors[status as keyof typeof colors]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export default function SettingsPage() {
  const [integrations, setIntegrations] =
    useState<Integration[]>(mockIntegrations)
  const [cloudProviders, setCloudProviders] =
    useState<CloudProvider[]>(mockCloudProviders)
  const [notifications, setNotifications] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [selfHosted, setSelfHosted] = useState(false)

  const handleSaveSettings = () => {
    toast.success('Your settings have been updated successfully.')
  }

  const handleTestConnection = (id: string, type: 'integration' | 'cloud') => {
    toast.success('Connection test initiated...')

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

  return (
    <div className="flex flex-col h-screen">
      <Header title="Pipeline Settings">
        <Button onClick={handleSaveSettings}>Save Changes</Button>
      </Header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="integrations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="cloud">Cloud Providers</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Source Control & CI/CD
                  </CardTitle>
                  <CardDescription>
                    Connect your repositories and CI/CD platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrations.map(integration => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(integration.status)}
                          <div>
                            <h3 className="font-medium">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Last sync: {integration.lastSync}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(integration.status)}
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
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cloud" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Cloud Providers
                  </CardTitle>
                  <CardDescription>
                    Manage your cloud provider connections and credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cloudProviders.map(provider => (
                      <div key={provider.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(provider.status)}
                            <div>
                              <h3 className="font-medium">{provider.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {provider.type.toUpperCase()} •{' '}
                                {provider.region}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(provider.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleTestConnection(provider.id, 'cloud')
                              }
                            >
                              Test
                            </Button>
                            <Button variant="outline" size="sm">
                              Configure
                            </Button>
                          </div>
                        </div>
                        {provider.services.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Connected Services:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {provider.services.map(service => (
                                <Badge key={service} variant="secondary">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cloud Provider
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys & Secrets
                  </CardTitle>
                  <CardDescription>
                    Manage your API keys and secret credentials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="github-token">
                        GitHub Personal Access Token
                      </Label>
                      <Input
                        id="github-token"
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <Label htmlFor="aws-access-key">AWS Access Key ID</Label>
                      <Input
                        id="aws-access-key"
                        type="password"
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                      />
                    </div>
                    <div>
                      <Label htmlFor="aws-secret-key">
                        AWS Secret Access Key
                      </Label>
                      <Input
                        id="aws-secret-key"
                        type="password"
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gcp-service-account">
                        GCP Service Account JSON
                      </Label>
                      <Input
                        id="gcp-service-account"
                        type="file"
                        accept=".json"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pipeline-notifications">
                        Pipeline Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when pipelines complete or fail
                      </p>
                    </div>
                    <Switch
                      id="pipeline-notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-sync">Auto Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync with connected services
                      </p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
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
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
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
                    <Label htmlFor="timeout">Pipeline Timeout (minutes)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      defaultValue="60"
                      min="5"
                      max="480"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

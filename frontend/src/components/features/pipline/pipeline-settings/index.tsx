import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PipelineSettingsType, Project } from '@/pages/builder'
import { GitBranch, Github, Search, Settings } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalLoading } from '@/hooks/useGlobalLoading'
import { useQuery } from '@/hooks/useQuery/useQuery'
import { IntegrationMutationResponse } from '@/api/actions/integrations/integrations.type'
const mockDetectedProjects: Project[] = [
  {
    id: 'frontend',
    name: 'Frontend App',
    type: 'frontend',
    path: 'apps/frontend',
    framework: 'Next.js',
    packageManager: 'npm',
    detected: true,
  },
  {
    id: 'backend',
    name: 'Backend API',
    type: 'backend',
    path: 'apps/backend',
    framework: 'Node.js',
    packageManager: 'npm',
    detected: true,
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    type: 'mobile',
    path: 'apps/mobile',
    framework: 'React Native',
    packageManager: 'yarn',
    detected: true,
  },
  {
    id: 'shared',
    name: 'Shared Library',
    type: 'shared',
    path: 'packages/shared',
    framework: 'TypeScript',
    packageManager: 'npm',
    detected: true,
  },
]
const engines = [
  { value: 'github', label: 'GitHub Actions', icon: Github },
  { value: 'jenkins', label: 'Jenkins', icon: Settings },
  { value: 'gitlab', label: 'GitLab CI', icon: GitBranch },
]
export const PipelineSettings = () => {
  const { showLoading, hideLoading } = useGlobalLoading()
  const [detectedProjects, setDetectedProjects] = useState<Project[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [matrixBuild, setMatrixBuild] = useState(false)
  const [conditionalSteps, setConditionalSteps] = useState(true)
  const [gitUrl, setGitUrl] = useState('')
  const [selectedGitAccount, setSelectedGitAccount] = useState('')

  const [pipelineSettings, setPipelineSettings] =
    useState<PipelineSettingsType>({
      name: '',
      engine: '',
      targetRepo: '',
      branch: 'main',
      runOnPush: true,
      runOnPR: false,
    })

  // Fetch Git integrations
  const { data: gitIntegrations = [], isLoading: isLoadingIntegrations } =
    useQuery<IntegrationMutationResponse[]>({
      queryKey: ['getAllIntegrations'],
      queryFn: client => async () => {
        return (
          await client.get<IntegrationMutationResponse[]>('/integrations')
        ).data
      },
      enabled: true,
    })

  // Filter only Git integrations
  const gitAccounts = gitIntegrations.filter(
    (integration: IntegrationMutationResponse) =>
      integration.platform === 'github' ||
      integration.platform === 'gitlab' ||
      integration.platform === 'gitbucket'
  )

  const detectProjects = useCallback(async () => {
    if (!selectedGitAccount) {
      toast.error('Please select a Git account')
      return
    }

    if (!gitUrl.trim()) {
      toast.error('Please enter a Git URL')
      return
    }

    if (!pipelineSettings.branch.trim()) {
      toast.error('Please enter a branch name')
      return
    }

    const selectedAccount = gitAccounts.find(
      account => account.id === selectedGitAccount
    )
    showLoading(`Cloning repository using ${selectedAccount?.name} account...`)

    try {
      // Simulate API call to clone repo and detect projects with selected git account
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate project detection from the cloned repo
      setDetectedProjects(mockDetectedProjects)
      setProjects(mockDetectedProjects)

      hideLoading()
      toast.success(
        `Found ${mockDetectedProjects.length} projects in repository: ${gitUrl}`
      )
    } catch (error) {
      hideLoading()
      toast.error('Failed to clone repository or detect projects')
    }
  }, [
    selectedGitAccount,
    gitUrl,
    pipelineSettings.branch,
    gitAccounts,
    showLoading,
    hideLoading,
  ])

  // Remove auto-detection on mount, now users must manually trigger detection after entering Git URL and branch

  return (
    <div className="p-4 border-b max-h-[50vh] overflow-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Pipeline Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pipeline-name">Pipeline Name</Label>
            <Input
              id="pipeline-name"
              placeholder="My Awesome Pipeline"
              value={pipelineSettings.name}
              onChange={e =>
                setPipelineSettings(prev => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="git-account">Git Account</Label>
            <Select
              value={selectedGitAccount}
              onValueChange={setSelectedGitAccount}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingIntegrations
                      ? 'Loading accounts...'
                      : 'Select Git account'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {gitAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      {account.platform === 'github' && (
                        <Github className="h-4 w-4" />
                      )}
                      {account.platform === 'gitlab' && (
                        <GitBranch className="h-4 w-4" />
                      )}
                      {account.platform === 'gitbucket' && (
                        <Settings className="h-4 w-4" />
                      )}
                      <span>{account.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({account.platform})
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {gitAccounts.length === 0 && !isLoadingIntegrations && (
                  <SelectItem value="" disabled>
                    No Git accounts found. Please add one in Settings.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose which Git account to use for repository access
            </p>
          </div>

          <div>
            <Label htmlFor="engine">CI/CD Engine</Label>
            <Select
              value={pipelineSettings.engine}
              onValueChange={(value: any) =>
                setPipelineSettings(prev => ({
                  ...prev,
                  engine: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select engine" />
              </SelectTrigger>
              <SelectContent>
                {engines.map(engine => (
                  <SelectItem key={engine.value} value={engine.value}>
                    <div className="flex items-center gap-2">
                      <engine.icon className="h-4 w-4" />
                      {engine.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="git-url">Git Repository URL</Label>
            <Input
              id="git-url"
              placeholder="https://github.com/username/repository.git"
              value={gitUrl}
              onChange={e => setGitUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the Git repository URL to clone and analyze
            </p>
          </div>

          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              placeholder="main"
              value={pipelineSettings.branch}
              onChange={e =>
                setPipelineSettings(prev => ({
                  ...prev,
                  branch: e.target.value,
                }))
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Specify the branch to analyze for project detection
            </p>
          </div>

          <div>
            <Label>Detected Projects</Label>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg mt-2">
                <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No projects detected</p>
                <p className="text-xs">
                  Enter Git URL and branch, then click detect to analyze
                  repository
                </p>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          project.type === 'frontend'
                            ? 'bg-blue-500'
                            : project.type === 'backend'
                              ? 'bg-green-500'
                              : project.type === 'mobile'
                                ? 'bg-purple-500'
                                : 'bg-gray-500'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium">
                          {project.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.path} • {project.framework}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {project.packageManager}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={detectProjects}
              disabled={
                !selectedGitAccount ||
                !gitUrl.trim() ||
                !pipelineSettings.branch.trim() ||
                isLoadingIntegrations
              }
            >
              <Search className="h-3 w-3 mr-1" />
              {projects.length === 0 ? 'Detect Projects' : 'Re-detect Projects'}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="matrix-build"
                checked={matrixBuild}
                onCheckedChange={checked => setMatrixBuild(!!checked)}
              />
              <Label htmlFor="matrix-build">Enable Matrix Build</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="conditional-steps"
                checked={conditionalSteps}
                onCheckedChange={checked => setConditionalSteps(!!checked)}
              />
              <Label htmlFor="conditional-steps">
                Conditional Steps (Only Changed)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="run-on-push"
                checked={pipelineSettings.runOnPush}
                onCheckedChange={checked =>
                  setPipelineSettings(prev => ({
                    ...prev,
                    runOnPush: !!checked,
                  }))
                }
              />
              <Label htmlFor="run-on-push">Run on Push</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="run-on-pr"
                checked={pipelineSettings.runOnPR}
                onCheckedChange={checked =>
                  setPipelineSettings(prev => ({
                    ...prev,
                    runOnPR: !!checked,
                  }))
                }
              />
              <Label htmlFor="run-on-pr">Run on Pull Request</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  TestTube,
  Rocket,
  Cloud,
  Lock,
  FileText,
  Trash2,
  Plus,
  Download,
  Upload,
  Github,
  GitBranch,
  ArrowRight,
  Settings,
  Code,
  Play,
  Search,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "react-toastify"
import { Header } from "@/layout/header"

interface Project {
  id: string
  name: string
  type: "frontend" | "backend" | "mobile" | "shared" | "api" | "docs"
  path: string
  framework: string
  packageManager: "npm" | "yarn" | "pnpm" | "maven" | "gradle" | "go" | "pip"
  detected: boolean
}

interface PipelineStep {
  id: string
  type: "build" | "test" | "deploy" | "cloud" | "secrets" | "custom"
  name: string
  config: Record<string, any>
  emoji: string
  targetProjects: string[] // Array of project IDs
  conditions?: {
    onlyIfChanged: boolean
    paths: string[]
  }
}

interface PipelineSettings {
  name: string
  engine: "github" | "jenkins" | "gitlab" | ""
  targetRepo: string
  branch: string
  runOnPush: boolean
  runOnPR: boolean
}

const stepTypes = [
  { type: "build", name: "Build", icon: Package, emoji: "📦", color: "bg-blue-100 text-blue-800" },
  { type: "test", name: "Test", icon: TestTube, emoji: "🧪", color: "bg-green-100 text-green-800" },
  { type: "deploy", name: "Deploy", icon: Rocket, emoji: "🚀", color: "bg-purple-100 text-purple-800" },
  { type: "cloud", name: "Cloud", icon: Cloud, emoji: "☁", color: "bg-orange-100 text-orange-800" },
  { type: "secrets", name: "Secrets/Env", icon: Lock, emoji: "🔒", color: "bg-red-100 text-red-800" },
  { type: "custom", name: "Custom Script", icon: FileText, emoji: "🗂️", color: "bg-gray-100 text-gray-800" },
]

const engines = [
  { value: "github", label: "GitHub Actions", icon: Github },
  { value: "jenkins", label: "Jenkins", icon: Settings },
  { value: "gitlab", label: "GitLab CI", icon: GitBranch },
]

const cloudProviders = [
  { value: "aws", label: "Amazon Web Services (AWS)" },
  { value: "gcp", label: "Google Cloud Platform (GCP)" },
  { value: "azure", label: "Microsoft Azure" },
]

const mockDetectedProjects: Project[] = [
  {
    id: "frontend",
    name: "Frontend App",
    type: "frontend",
    path: "apps/frontend",
    framework: "Next.js",
    packageManager: "npm",
    detected: true,
  },
  {
    id: "backend",
    name: "Backend API",
    type: "backend",
    path: "apps/backend",
    framework: "Node.js",
    packageManager: "npm",
    detected: true,
  },
  {
    id: "mobile",
    name: "Mobile App",
    type: "mobile",
    path: "apps/mobile",
    framework: "React Native",
    packageManager: "yarn",
    detected: true,
  },
  {
    id: "shared",
    name: "Shared Library",
    type: "shared",
    path: "packages/shared",
    framework: "TypeScript",
    packageManager: "npm",
    detected: true,
  },
]

export default function BuilderPage() {
  const [pipelineSettings, setPipelineSettings] = useState<PipelineSettings>({
    name: "",
    engine: "",
    targetRepo: "",
    branch: "main",
    runOnPush: true,
    runOnPR: false,
  })

  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [selectedStep, setSelectedStep] = useState<PipelineStep | null>(null)
  const [generatedCode, setGeneratedCode] = useState("")

  const [projects, setProjects] = useState<Project[]>([])
  const [detectedProjects, setDetectedProjects] = useState<Project[]>([])
  const [matrixBuild, setMatrixBuild] = useState(false)
  const [conditionalSteps, setConditionalSteps] = useState(true)

  const getDefaultConfig = (type: PipelineStep["type"]) => {
    const baseConfig = {
      targetProjects: ["all"], // Default to all projects
      conditions: {
        onlyIfChanged: true,
        paths: [],
      },
    }

    switch (type) {
      case "build":
        return {
          ...baseConfig,
          buildCommand: "npm run build",
          nodeVersion: "20",
          installCommand: "npm install",
          workspaceCommand: "npm run build --workspace=",
        }
      case "test":
        return {
          testCommand: "npm test",
          coverage: true,
          testFramework: "jest",
        }
      case "deploy":
        return {
          target: "production",
          deployCommand: "npm run deploy",
          environment: "production",
        }
      case "cloud":
        return {
          provider: "aws",
          service: "ec2",
          region: "us-east-1",
        }
      case "secrets":
        return {
          secrets: ["API_KEY", "DATABASE_URL"],
          envFile: ".env.production",
        }
      case "custom":
        return {
          script: "echo 'Custom script'",
          language: "bash",
        }
      default:
        return {}
    }
  }

  const addStep = useCallback((type: PipelineStep["type"]) => {
    const stepType = stepTypes.find((s) => s.type === type)
    const newStep: PipelineStep = {
      id: `step-${Date.now()}`,
      type,
      name: `${stepType?.name} Step`,
      emoji: stepType?.emoji || "📋",
      config: getDefaultConfig(type),
      targetProjects: ["all"],
    }
    setSteps((prev) => [...prev, newStep])
  }, [])

  const removeStep = useCallback(
    (id: string) => {
      setSteps((prev) => prev.filter((step) => step.id !== id))
      if (selectedStep?.id === id) {
        setSelectedStep(null)
      }
    },
    [selectedStep],
  )

  const updateStepConfig = useCallback(
    (id: string, config: Record<string, any>) => {
      setSteps((prev) =>
        prev.map((step) => (step.id === id ? { ...step, config: { ...step.config, ...config } } : step)),
      )
      if (selectedStep?.id === id) {
        setSelectedStep((prev) => (prev ? { ...prev, config: { ...prev.config, ...config } } : null))
      }
    },
    [selectedStep],
  )

  const generatePipeline = () => {
    if (!pipelineSettings.name || !pipelineSettings.engine || steps.length === 0) {
      toast.warning("Please fill in pipeline name, select engine, and add at least one step.")
      return
    }

    let code = ""
    if (pipelineSettings.engine === "github") {
      code = generateGitHubActions()
    } else if (pipelineSettings.engine === "jenkins") {
      code = generateJenkinsfile()
    } else if (pipelineSettings.engine === "gitlab") {
      code = generateGitLabCI()
    }

    setGeneratedCode(code)
    navigator.clipboard.writeText(code)

    toast.success("Pipeline code has been generated and copied to clipboard.")
  }

  const generateGitHubActions = () => {
    const triggers = []
    if (pipelineSettings.runOnPush) triggers.push("push")
    if (pipelineSettings.runOnPR) triggers.push("pull_request")

    // Generate paths-ignore for conditional execution
    const pathsConfig = conditionalSteps
      ? `
    paths:
      - '**'
    paths-ignore:
      - 'docs/**'
      - '*.md'`
      : ""

    let matrixConfig = ""
    if (matrixBuild && projects.length > 1) {
      matrixConfig = `
    strategy:
      matrix:
        project: [${projects.map((p) => `"${p.id}"`).join(", ")}]
        include:${projects
          .map(
            (p) => `
          - project: "${p.id}"
            path: "${p.path}"
            package-manager: "${p.packageManager}"`,
          )
          .join("")}
    `
    }

    return `name: ${pipelineSettings.name}

on:
  ${triggers
    .map(
      (trigger) => `${trigger}:
    branches: [ ${pipelineSettings.branch} ]${pathsConfig}`,
    )
    .join("\n  ")}

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:${projects
      .map(
        (p) => `
      ${p.id}-changed: \${{ steps.changes.outputs.${p.id} }}`,
      )
      .join("")}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |${projects
            .map(
              (p) => `
            ${p.id}:
              - '${p.path}/**'`,
            )
            .join("")}

  pipeline:
    needs: detect-changes
    runs-on: ubuntu-latest${matrixConfig}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
${steps
  .map((step, index) => {
    const targetProjects = step.targetProjects || ["all"]
    const isAllProjects = targetProjects.includes("all")

    // Generate conditional logic
    let condition = ""
    if (conditionalSteps && !isAllProjects) {
      const conditions = targetProjects
        .map((projectId) => `needs.detect-changes.outputs.${projectId}-changed == 'true'`)
        .join(" || ")
      condition = `
      if: ${conditions}`
    }

    switch (step.type) {
      case "build":
        if (matrixBuild && !isAllProjects) {
          return `    - name: ${step.name}${condition}
      if: \${{ contains(fromJSON('["${targetProjects.join('", "')}"]'), matrix.project) }}
      working-directory: \${{ matrix.path }}
      run: |
        ${step.config.installCommand || "npm install"}
        ${step.config.buildCommand || "npm run build"}`
        } else if (isAllProjects) {
          return `    - name: ${step.name}${condition}
      run: |
        # Install dependencies for all projects
        ${step.config.installCommand || "npm install"}
        
        # Build all projects
${projects
  .map(
    (p) => `        # Build ${p.name}
        cd ${p.path}
        ${step.config.buildCommand || "npm run build"}
        cd ..`,
  )
  .join("\n")}`
        } else {
          return `    - name: ${step.name}${condition}
      run: |
${targetProjects
  .map((projectId) => {
    const project = projects.find((p) => p.id === projectId)
    return `        # Build ${project?.name || projectId}
        cd ${project?.path || projectId}
        ${step.config.installCommand || "npm install"}
        ${step.config.buildCommand || "npm run build"}
        cd ..`
  })
  .join("\n")}`
        }

      case "test":
        if (matrixBuild && !isAllProjects) {
          return `    - name: ${step.name}${condition}
      if: \${{ contains(fromJSON('["${targetProjects.join('", "')}"]'), matrix.project) }}
      working-directory: \${{ matrix.path }}
      run: |
        ${step.config.testCommand || "npm test"}`
        } else {
          return `    - name: ${step.name}${condition}
      run: |
${
  isAllProjects
    ? projects
        .map(
          (p) => `        # Test ${p.name}
        cd ${p.path}
        ${step.config.testCommand || "npm test"}
        cd ..`,
        )
        .join("\n")
    : targetProjects
        .map((projectId) => {
          const project = projects.find((p) => p.id === projectId)
          return `        # Test ${project?.name || projectId}
        cd ${project?.path || projectId}
        ${step.config.testCommand || "npm test"}
        cd ..`
        })
        .join("\n")
}`
        }

      case "deploy":
        return `    - name: ${step.name}${condition}
      run: |
        echo "Deploying to ${step.config.environment || "production"}"
${
  isAllProjects
    ? projects
        .map(
          (p) => `        # Deploy ${p.name}
        cd ${p.path}
        ${step.config.deployCommand || "npm run deploy"}
        cd ..`,
        )
        .join("\n")
    : targetProjects
        .map((projectId) => {
          const project = projects.find((p) => p.id === projectId)
          return `        # Deploy ${project?.name || projectId}
        cd ${project?.path || projectId}
        ${step.config.deployCommand || "npm run deploy"}
        cd ..`
        })
        .join("\n")
}`

      case "cloud":
        return `    - name: ${step.name}${condition}
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${step.config.region || "us-east-1"}`

      case "secrets":
        return `    - name: ${step.name}${condition}
      env:
${step.config.secrets?.map((secret: string) => `        ${secret}: \${{ secrets.${secret} }}`).join("\n") || "        # Add your secrets here"}`

      case "custom":
        return `    - name: ${step.name}${condition}
      run: |
        ${step.config.script || 'echo "Custom script"'}`

      default:
        return `    - name: ${step.name}${condition}
      run: echo "Step: ${step.name}"`
    }
  })
  .join("\n\n")}
`
  }

  const generateJenkinsfile = () => {
    return `pipeline {
    agent any
    
    environment {
${
  steps
    .filter((s) => s.type === "secrets")
    .flatMap((s) => s.config.secrets || [])
    .map((secret: string) => `        ${secret} = credentials('${secret.toLowerCase()}')`)
    .join("\n") || "        // Add your environment variables here"
}
    }
    
    stages {
${steps
  .map(
    (step) => `        stage('${step.name}') {
            steps {
                script {
                    ${getJenkinsStepScript(step)}
                }
            }
        }`,
  )
  .join("\n")}
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}`
  }

  const getJenkinsStepScript = (step: PipelineStep) => {
    switch (step.type) {
      case "build":
        return `sh '${step.config.installCommand || "npm install"}'
                    sh '${step.config.buildCommand || "npm run build"}'`
      case "test":
        return `sh '${step.config.testCommand || "npm test"}'`
      case "deploy":
        return `sh '${step.config.deployCommand || "npm run deploy"}'`
      case "custom":
        return `sh '''${step.config.script || 'echo "Custom script"'}'''`
      default:
        return `echo 'Running ${step.name}'`
    }
  }

  const generateGitLabCI = () => {
    return `stages:
${steps.map((step) => `  - ${step.type}`).join("\n")}

variables:
${
  steps
    .filter((s) => s.type === "secrets")
    .flatMap((s) => s.config.secrets || [])
    .map((secret: string) => `  ${secret}: $${secret}`)
    .join("\n") || "  # Add your variables here"
}

${steps
  .map(
    (step) => `${step.name.toLowerCase().replace(/\s+/g, "_")}:
  stage: ${step.type}
  script:
    - ${getGitLabStepScript(step)}
  ${step.type === "build" ? "artifacts:\n    paths:\n      - dist/\n      - build/" : ""}
`,
  )
  .join("\n")}
`
  }

  const getGitLabStepScript = (step: PipelineStep) => {
    switch (step.type) {
      case "build":
        return `${step.config.installCommand || "npm install"}\n    - ${step.config.buildCommand || "npm run build"}`
      case "test":
        return step.config.testCommand || "npm test"
      case "deploy":
        return step.config.deployCommand || "npm run deploy"
      case "custom":
        return step.config.script || 'echo "Custom script"'
      default:
        return `echo "Running ${step.name}"`
    }
  }

  const uploadPipeline = () => {
    toast.success("Pipeline configuration uploaded successfully to repository.")
  }

  const renderStepConfig = () => {
    if (!selectedStep) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Settings className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a step to configure</p>
          <p className="text-sm">Click on any step in the pipeline flow</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Project Targeting Section */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <Label className="text-sm font-medium">Target Projects</Label>
          <p className="text-xs text-muted-foreground mb-3">Select which projects this step should run for</p>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-projects"
                checked={selectedStep.targetProjects?.includes("all") || false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateStepConfig(selectedStep.id, { targetProjects: ["all"] })
                  } else {
                    updateStepConfig(selectedStep.id, { targetProjects: [] })
                  }
                }}
              />
              <Label htmlFor="all-projects" className="text-sm">
                All Projects
              </Label>
            </div>

            {!selectedStep.targetProjects?.includes("all") && (
              <div className="grid grid-cols-1 gap-2 ml-6">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedStep.targetProjects?.includes(project.id) || false}
                      onCheckedChange={(checked) => {
                        const currentTargets = selectedStep.targetProjects || []
                        const newTargets = checked
                          ? [...currentTargets.filter((t) => t !== "all"), project.id]
                          : currentTargets.filter((t) => t !== project.id)
                        updateStepConfig(selectedStep.id, { targetProjects: newTargets })
                      }}
                    />
                    <Label htmlFor={`project-${project.id}`} className="text-sm flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          project.type === "frontend"
                            ? "bg-blue-500"
                            : project.type === "backend"
                              ? "bg-green-500"
                              : project.type === "mobile"
                                ? "bg-purple-500"
                                : "bg-gray-500"
                        }`}
                      />
                      {project.name}
                      <span className="text-xs text-muted-foreground">({project.path})</span>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conditional Execution */}
        {conditionalSteps && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <Label className="text-sm font-medium">Conditional Execution</Label>
            <p className="text-xs text-muted-foreground mb-3">Run this step only when specific conditions are met</p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="only-if-changed"
                  checked={selectedStep.config.conditions?.onlyIfChanged || false}
                  onCheckedChange={(checked) =>
                    updateStepConfig(selectedStep.id, {
                      conditions: {
                        ...selectedStep.config.conditions,
                        onlyIfChanged: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="only-if-changed" className="text-sm">
                  Only run if project files changed
                </Label>
              </div>

              {selectedStep.config.conditions?.onlyIfChanged && (
                <div>
                  <Label htmlFor="watch-paths" className="text-sm">
                    Watch Paths (optional)
                  </Label>
                  <Textarea
                    id="watch-paths"
                    placeholder="apps/frontend/**\npackages/shared/**"
                    value={selectedStep.config.conditions?.paths?.join("\n") || ""}
                    onChange={(e) =>
                      updateStepConfig(selectedStep.id, {
                        conditions: {
                          ...selectedStep.config.conditions,
                          paths: e.target.value.split("\n").filter((p) => p.trim()),
                        },
                      })
                    }
                    className="text-xs"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    One path per line. Leave empty to auto-detect based on target projects.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Step-specific configuration */}
        <div>
          <Label htmlFor="step-name">Step Name</Label>
          <Input
            id="step-name"
            value={selectedStep.name}
            onChange={(e) => {
              const updatedStep = { ...selectedStep, name: e.target.value }
              setSelectedStep(updatedStep)
              setSteps((prev) => prev.map((step) => (step.id === selectedStep.id ? updatedStep : step)))
            }}
          />
        </div>

        {selectedStep.type === "build" && (
          <>
            <div>
              <Label htmlFor="workspace-mode">Workspace Mode</Label>
              <Select
                value={selectedStep.config.workspaceMode || "individual"}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { workspaceMode: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workspace mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Build Each Project Individually</SelectItem>
                  <SelectItem value="parallel">Build All Projects in Parallel</SelectItem>
                  <SelectItem value="sequential">Build All Projects Sequentially</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="install-command">Install Command</Label>
              <Input
                id="install-command"
                placeholder="npm install"
                value={selectedStep.config.installCommand || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { installCommand: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="build-command">Build Command</Label>
              <Input
                id="build-command"
                placeholder="npm run build"
                value={selectedStep.config.buildCommand || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { buildCommand: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="workspace-command">Workspace Command Template</Label>
              <Input
                id="workspace-command"
                placeholder="npm run build --workspace="
                value={selectedStep.config.workspaceCommand || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { workspaceCommand: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Template for running commands in specific workspaces. Project path will be appended.
              </p>
            </div>

            <div>
              <Label htmlFor="node-version">Node.js Version</Label>
              <Select
                value={selectedStep.config.nodeVersion || ""}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { nodeVersion: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Node.js version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">Node.js 18</SelectItem>
                  <SelectItem value="20">Node.js 20</SelectItem>
                  <SelectItem value="21">Node.js 21</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {matrixBuild && (
              <div className="p-3 border rounded bg-blue-50">
                <Label className="text-sm font-medium text-blue-800">Matrix Build Configuration</Label>
                <p className="text-xs text-blue-600 mt-1">
                  This step will run in parallel for each selected project using matrix strategy.
                </p>
              </div>
            )}
          </>
        )}

        {selectedStep.type === "test" && (
          <>
            <div>
              <Label htmlFor="test-command">Test Command</Label>
              <Input
                id="test-command"
                placeholder="npm test"
                value={selectedStep.config.testCommand || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { testCommand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="test-framework">Test Framework</Label>
              <Select
                value={selectedStep.config.testFramework || ""}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { testFramework: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jest">Jest</SelectItem>
                  <SelectItem value="vitest">Vitest</SelectItem>
                  <SelectItem value="mocha">Mocha</SelectItem>
                  <SelectItem value="cypress">Cypress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="coverage"
                checked={selectedStep.config.coverage || false}
                onCheckedChange={(checked) => updateStepConfig(selectedStep.id, { coverage: checked })}
              />
              <Label htmlFor="coverage">Enable Code Coverage</Label>
            </div>
            <div>
              <Label htmlFor="test-timeout">Test Timeout (minutes)</Label>
              <Input
                id="test-timeout"
                type="number"
                placeholder="30"
                value={selectedStep.config.timeout || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { timeout: e.target.value })}
              />
            </div>
          </>
        )}

        {selectedStep.type === "deploy" && (
          <>
            <div>
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={selectedStep.config.environment || ""}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { environment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deploy-command">Deploy Command</Label>
              <Input
                id="deploy-command"
                placeholder="npm run deploy"
                value={selectedStep.config.deployCommand || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { deployCommand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="deploy-target">Deploy Target</Label>
              <Input
                id="deploy-target"
                placeholder="production server"
                value={selectedStep.config.target || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { target: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pre-deploy-script">Pre-deploy Script</Label>
              <Textarea
                id="pre-deploy-script"
                placeholder="#!/bin/bash\necho 'Running pre-deploy checks'"
                value={selectedStep.config.preDeployScript || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { preDeployScript: e.target.value })}
                rows={3}
              />
            </div>
          </>
        )}

        {selectedStep.type === "cloud" && (
          <>
            <div>
              <Label htmlFor="cloud-provider">Cloud Provider</Label>
              <Select
                value={selectedStep.config.provider || ""}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cloud provider" />
                </SelectTrigger>
                <SelectContent>
                  {cloudProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                placeholder="us-east-1"
                value={selectedStep.config.region || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { region: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="service">Service</Label>
              <Select
                value={selectedStep.config.service || ""}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { service: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ec2">EC2 (Virtual Machines)</SelectItem>
                  <SelectItem value="lambda">Lambda (Serverless)</SelectItem>
                  <SelectItem value="ecs">ECS (Containers)</SelectItem>
                  <SelectItem value="s3">S3 (Storage)</SelectItem>
                  <SelectItem value="rds">RDS (Database)</SelectItem>
                  <SelectItem value="cloudfront">CloudFront (CDN)</SelectItem>
                  <SelectItem value="apigateway">API Gateway</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="instance-type">Instance Type / Configuration</Label>
              <Input
                id="instance-type"
                placeholder="t3.micro"
                value={selectedStep.config.instanceType || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { instanceType: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="auto-scaling">Auto Scaling</Label>
              <Select
                value={selectedStep.config.autoScaling || "false"}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { autoScaling: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enable Auto Scaling</SelectItem>
                  <SelectItem value="false">Disable Auto Scaling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {selectedStep.type === "secrets" && (
          <>
            <div>
              <Label htmlFor="secrets-list">Environment Variables / Secrets</Label>
              <Textarea
                id="secrets-list"
                placeholder="API_KEY\nDATABASE_URL\nJWT_SECRET\nSTRIPE_SECRET_KEY"
                value={selectedStep.config.secrets?.join("\n") || ""}
                onChange={(e) =>
                  updateStepConfig(selectedStep.id, {
                    secrets: e.target.value.split("\n").filter((s) => s.trim()),
                  })
                }
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">One secret per line</p>
            </div>
            <div>
              <Label htmlFor="env-file">Environment File</Label>
              <Input
                id="env-file"
                placeholder=".env.production"
                value={selectedStep.config.envFile || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { envFile: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="secret-source">Secret Source</Label>
              <Select
                value={selectedStep.config.secretSource || "github"}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { secretSource: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub Secrets</SelectItem>
                  <SelectItem value="vault">HashiCorp Vault</SelectItem>
                  <SelectItem value="aws">AWS Secrets Manager</SelectItem>
                  <SelectItem value="azure">Azure Key Vault</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {selectedStep.type === "custom" && (
          <>
            <div>
              <Label htmlFor="script-language">Script Language</Label>
              <Select
                value={selectedStep.config.language || ""}
                onValueChange={(value) => updateStepConfig(selectedStep.id, { language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bash">Bash</SelectItem>
                  <SelectItem value="powershell">PowerShell</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="node">Node.js</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="docker">Docker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="custom-script">Custom Script</Label>
              <Textarea
                id="custom-script"
                placeholder="#!/bin/bash\necho 'Running custom script'\n# Add your commands here\n\n# Example: Database migration\n# npm run db:migrate\n\n# Example: Cache warming\n# curl -X POST https://api.example.com/cache/warm"
                value={selectedStep.config.script || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { script: e.target.value })}
                className="min-h-[150px] font-mono text-sm"
                rows={8}
              />
            </div>
            <div>
              <Label htmlFor="working-directory">Working Directory</Label>
              <Input
                id="working-directory"
                placeholder="./scripts"
                value={selectedStep.config.workingDirectory || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { workingDirectory: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="timeout">Timeout (minutes)</Label>
              <Input
                id="timeout"
                type="number"
                placeholder="30"
                value={selectedStep.config.timeout || ""}
                onChange={(e) => updateStepConfig(selectedStep.id, { timeout: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="continue-on-error"
                checked={selectedStep.config.continueOnError || false}
                onCheckedChange={(checked) => updateStepConfig(selectedStep.id, { continueOnError: checked })}
              />
              <Label htmlFor="continue-on-error">Continue on Error</Label>
            </div>
          </>
        )}
      </div>
    )
  }

  const detectProjects = useCallback(() => {
    // Simulate project detection
    setDetectedProjects(mockDetectedProjects)
    setProjects(mockDetectedProjects)

    toast.success(`Found ${mockDetectedProjects.length} projects in repository`)
  }, [toast])

  useEffect(() => {
    detectProjects()
  }, [detectProjects])

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <Header title="Pipeline Builder">
          <div className="flex gap-2">
            <Button onClick={generatePipeline} className="gap-2">
              <Code className="h-4 w-4" />
              Generate Pipeline
            </Button>
            <Button onClick={uploadPipeline} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload to Repo
            </Button>
          </div>
       </Header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-12 h-full">
          {/* Left Panel */}
          <div className="col-span-3 border-r bg-muted/30 flex flex-col">
            {/* Pipeline Settings */}
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
                      onChange={(e) => setPipelineSettings((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="engine">CI/CD Engine</Label>
                    <Select
                      value={pipelineSettings.engine}
                      onValueChange={(value: any) => setPipelineSettings((prev) => ({ ...prev, engine: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select engine" />
                      </SelectTrigger>
                      <SelectContent>
                        {engines.map((engine) => (
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
                    <Label htmlFor="target-repo">Target Repository</Label>
                    <Input
                      id="target-repo"
                      placeholder="username/repository"
                      value={pipelineSettings.targetRepo}
                      onChange={(e) => setPipelineSettings((prev) => ({ ...prev, targetRepo: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      placeholder="main"
                      value={pipelineSettings.branch}
                      onChange={(e) => setPipelineSettings((prev) => ({ ...prev, branch: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Detected Projects</Label>
                    <div className="space-y-2 mt-2">
                      {projects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                project.type === "frontend"
                                  ? "bg-blue-500"
                                  : project.type === "backend"
                                    ? "bg-green-500"
                                    : project.type === "mobile"
                                      ? "bg-purple-500"
                                      : "bg-gray-500"
                              }`}
                            />
                            <div>
                              <div className="text-sm font-medium">{project.name}</div>
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
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={detectProjects}>
                      <Search className="h-3 w-3 mr-1" />
                      Re-detect Projects
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="matrix-build"
                        checked={matrixBuild}
                        onCheckedChange={(checked) => setMatrixBuild(!!checked)}
                      />
                      <Label htmlFor="matrix-build">Enable Matrix Build</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="conditional-steps"
                        checked={conditionalSteps}
                        onCheckedChange={(checked) => setConditionalSteps(!!checked)}
                      />
                      <Label htmlFor="conditional-steps">Conditional Steps (Only Changed)</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="run-on-push"
                        checked={pipelineSettings.runOnPush}
                        onCheckedChange={(checked) =>
                          setPipelineSettings((prev) => ({ ...prev, runOnPush: !!checked }))
                        }
                      />
                      <Label htmlFor="run-on-push">Run on Push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="run-on-pr"
                        checked={pipelineSettings.runOnPR}
                        onCheckedChange={(checked) => setPipelineSettings((prev) => ({ ...prev, runOnPR: !!checked }))}
                      />
                      <Label htmlFor="run-on-pr">Run on Pull Request</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Steps */}
            <div className="flex-1 p-4 overflow-auto min-h-0">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Available Steps</CardTitle>
                  <CardDescription>Drag or click to add steps</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {stepTypes.map((stepType) => {
                      const Icon = stepType.icon
                      return (
                        <Button
                          key={stepType.type}
                          variant="outline"
                          className="justify-start gap-3 h-auto p-3 text-left"
                          onClick={() => addStep(stepType.type)}
                        >
                          <span className="text-lg">{stepType.emoji}</span>
                          <div>
                            <div className="font-medium">{stepType.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {stepType.type === "build" && "Compile and build your application"}
                              {stepType.type === "test" && "Run tests and generate coverage"}
                              {stepType.type === "deploy" && "Deploy to target environment"}
                              {stepType.type === "cloud" && "Deploy to cloud providers"}
                              {stepType.type === "secrets" && "Manage environment variables"}
                              {stepType.type === "custom" && "Run custom scripts"}
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Center Panel - Pipeline Flow */}
          <div className="col-span-5 p-4 overflow-auto">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Pipeline Flow</CardTitle>
                <CardDescription>Configure your pipeline workflow</CardDescription>
              </CardHeader>
              <CardContent>
                {steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Plus className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No steps added yet</p>
                    <p className="text-sm">Add steps from the left panel to build your pipeline</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedStep?.id === step.id
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedStep(step)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                {index + 1}
                              </div>
                              <span className="text-2xl">{step.emoji}</span>
                              <div>
                                <div className="font-medium">{step.name}</div>
                                <div className="text-sm text-muted-foreground capitalize">{step.type} step</div>

                                {/* Show target projects */}
                                <div className="flex items-center gap-1 mt-1">
                                  {step.targetProjects?.includes("all") ? (
                                    <Badge variant="outline" className="text-xs">
                                      All Projects
                                    </Badge>
                                  ) : (
                                    step.targetProjects?.map((projectId) => {
                                      const project = projects.find((p) => p.id === projectId)
                                      return (
                                        <Badge
                                          key={projectId}
                                          variant="outline"
                                          className="text-xs flex items-center gap-1"
                                        >
                                          <div
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              project?.type === "frontend"
                                                ? "bg-blue-500"
                                                : project?.type === "backend"
                                                  ? "bg-green-500"
                                                  : project?.type === "mobile"
                                                    ? "bg-purple-500"
                                                    : "bg-gray-500"
                                            }`}
                                          />
                                          {project?.name || projectId}
                                        </Badge>
                                      )
                                    })
                                  )}
                                </div>

                                {/* Show conditional execution indicator */}
                                {step.config.conditions?.onlyIfChanged && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      📋 Conditional
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {Object.keys(step.config).length} configs
                              </Badge>
                              {matrixBuild && !step.targetProjects?.includes("all") && (
                                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                  Matrix
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeStep(step.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Arrow between steps */}
                        {index < steps.length - 1 && (
                          <div className="flex justify-center py-2">
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Configuration & Code Preview */}
          <div className="col-span-4 border-l bg-muted/30 flex flex-col">
            <Tabs defaultValue="config" className="flex-1 flex flex-col">
              <div className="border-b px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                  <TabsTrigger value="preview">Code Preview</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="config" className="flex-1 p-4 overflow-auto">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Step Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>{renderStepConfig()}</CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Generated Pipeline Code
                    </CardTitle>
                    <CardDescription>
                      {pipelineSettings.engine === "github" && ".github/workflows/pipeline.yml"}
                      {pipelineSettings.engine === "jenkins" && "Jenkinsfile"}
                      {pipelineSettings.engine === "gitlab" && ".gitlab-ci.yml"}
                      {!pipelineSettings.engine && "Select an engine to see preview"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedCode ? (
                      <div className="relative">
                        <pre className="bg-black text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                          <code>{generatedCode}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCode)
                            toast.success("Code copied to clipboard" )
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Play className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-center">
                          {!pipelineSettings.engine
                            ? "Select a CI/CD engine to see code preview"
                            : "Click 'Generate Pipeline' to see the code"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, Play, CheckCircle, XCircle, Clock, GitBranch, Calendar } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { Header } from "@/layout/header"

interface Pipeline {
  id: string
  name: string
  status: "running" | "success" | "failed" | "pending"
  lastRun: string
  branch: string
  duration: string
  engine: "github" | "jenkins" | "gitlab"
}

const mockPipelines: Pipeline[] = [
  {
    id: "1",
    name: "Frontend Deploy",
    status: "success",
    lastRun: "2 minutes ago",
    branch: "main",
    duration: "3m 45s",
    engine: "github",
  },
  {
    id: "2",
    name: "API Backend",
    status: "running",
    lastRun: "5 minutes ago",
    branch: "develop",
    duration: "2m 12s",
    engine: "jenkins",
  },
  {
    id: "3",
    name: "Mobile App Build",
    status: "failed",
    lastRun: "1 hour ago",
    branch: "feature/auth",
    duration: "8m 30s",
    engine: "gitlab",
  },
  {
    id: "4",
    name: "Database Migration",
    status: "pending",
    lastRun: "3 hours ago",
    branch: "main",
    duration: "1m 20s",
    engine: "github",
  },
]

const getStatusIcon = (status: Pipeline["status"]) => {
  switch (status) {
    case "running":
      return <Play className="h-4 w-4 text-blue-500" />
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />
  }
}

const getStatusBadge = (status: Pipeline["status"]) => {
  const variants = {
    running: "default",
    success: "default",
    failed: "destructive",
    pending: "secondary",
  } as const

  const colors = {
    running: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  }

  return <Badge className={colors[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}

export default function HomePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(mockPipelines)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelines((prev) =>
        prev.map((pipeline) => {
          if (pipeline.status === "running" && Math.random() > 0.7) {
            return {
              ...pipeline,
              status: Math.random() > 0.5 ? "success" : ("failed" as const),
              lastRun: "Just now",
            }
          }
          return pipeline
        }),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const stats = {
    total: pipelines.length,
    running: pipelines.filter((p) => p.status === "running").length,
    success: pipelines.filter((p) => p.status === "success").length,
    failed: pipelines.filter((p) => p.status === "failed").length,
  }

  return (
    <div className="flex flex-col h-screen">
       <Header title="Dashboard">
          <Link to="/builder">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Pipeline
            </Button>
          </Link>
        </Header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pipelines</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Running</CardTitle>
                <Play className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pipelines List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Pipelines</CardTitle>
              <CardDescription>Manage and monitor your CI/CD pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(pipeline.status)}
                      <div>
                        <h3 className="font-medium">{pipeline.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <GitBranch className="h-3 w-3" />
                          <span>{pipeline.branch}</span>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{pipeline.lastRun}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{pipeline.duration}</div>
                        <div className="text-xs text-muted-foreground capitalize">{pipeline.engine}</div>
                      </div>
                      {getStatusBadge(pipeline.status)}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export interface AnalyzedProjectMutationsArgs {
  gitUrl: string
  gitAccountId: string
  description: string
  projectName: string
}

export interface AnalyzedProjectMutationResponse {
  id: string
  projectName: string
  description: string
  gitUrl: string
  repoStorage: string
  totalProject: string
  projectPath: ProjectPathMutations[]

}

export interface ProjectPathMutations{
    name: string
    path: string
    framework: string
    packageManager: string
    detected: boolean
}

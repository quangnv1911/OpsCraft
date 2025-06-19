export enum TechnologyStack {
    NODEJS = 'nodejs',
    JAVA = 'java',
    DOTNET = 'dotnet',
    PYTHON = 'python',
    UNKNOWN = 'unknown',
}

export interface ProjectPath {
    name: string;
    path: string;
    technology: TechnologyStack;
    framework?: string;
    version?: string;
    buildTool?: string;
    dependencies?: string[];
}

export interface AnalyzeProjectResult {
    id: string;
    projectName: string;
    description: string;
    gitUrl: string;
    totalProjects: number;
    repoStorage: string;
    projectPaths: ProjectPath[];
    mainTechnology: TechnologyStack;
    technologies: TechnologyStack[];
}

export interface GitAccount {
    id: string;
    name: string;
    user_name: string;
    platform: string;
}

export interface ProjectAnalysis {
    technology: TechnologyStack;
    framework?: string;
    version?: string;
    buildTool?: string;
    dependencies?: string[];
}

export interface ProjectPath {
    name: string;
    path: string;
}
export interface AnalyzeProjectResult {
    id: string;
    gitUrl: string;
    totalProjects: number;
    repoStorage: string;
    projectPaths: ProjectPath[];
}

export interface GitAccount {
    id: string;
    name: string;
    user_name: string;
    platform: string;
}

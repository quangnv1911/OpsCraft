export interface PipelineStep {
    command: string;
}

export interface PipelineProject {
    name: string;
    image: string;
    steps: PipelineStep[];
}

export interface PipelineStage {
    id: string;
    name: string;
    parallel?: boolean;
    projects?: PipelineProject[];
    steps?: PipelineStep[];
}

export interface PipelineConfig {
    trigger: { branch?: string };
    stages: PipelineStage[];
}

export interface GeneratedFileInfo {
    filePath: string;
    content: string;
    isOverwritten: boolean;
}

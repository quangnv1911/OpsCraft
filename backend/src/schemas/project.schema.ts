import { z } from 'zod';

// Define schema for analyze project
export const AnalyzeProjectSchema = z.object({
    gitUrl: z.string().min(1, 'Please enter a git url').url('Git url is invalid'),
    gitAccountId: z.string().min(1, 'Please select a git account'),
    description: z.string(),
    projectName: z.string().min(4, 'Project Name can not be empty')
});

// Optional: infer TypeScript type from schema
export type AnalyzeProjectSchema = z.infer<typeof AnalyzeProjectSchema>;

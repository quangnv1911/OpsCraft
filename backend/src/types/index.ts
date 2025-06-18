import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// User Types
export interface User {
    id: string;
    email: string;
    username?: string;
    googleId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserProfile {
    id: string;
    email: string;
    username?: string;
    provider: 'local' | 'google';
}

// Auth Types
export interface AuthRequest extends Request {
    user?: User;
}

export interface AuthResponse extends Response {
    user?: User;
}

export interface CustomJwtPayload extends JwtPayload {
    userId: string;
    email: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    username?: string;
}

// Pipeline Types
export interface Pipeline {
    id: string;
    name: string;
    description?: string;
    repositoryUrl: string;
    branch: string;
    buildScript?: string;
    deployScript?: string;
    status: 'idle' | 'building' | 'deploying' | 'success' | 'failed';
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PipelineExecution {
    id: string;
    pipelineId: string;
    status: 'running' | 'success' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    logs?: string;
    error?: string;
}

// Project Types
export interface Project {
    id: string;
    name: string;
    description?: string;
    repositoryUrl: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

// Git Types
export interface GitRepository {
    name: string;
    url: string;
    branch: string;
    lastCommit?: {
        hash: string;
        message: string;
        author: string;
        date: Date;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Middleware Types

export type AuthHandler = (req: AuthRequest, res: AuthResponse, next: any) => Promise<void>;

// Service Response Types
export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export type ApiResponse<T = any> = {
    success: boolean;
    message?: string;
    data?: T;
    error?: any;
};

export interface ErrnoException extends Error {
    code?: string;
    errno?: number;
    syscall?: string;
    path?: string;
}

// Express Types Extensions
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export enum GitPlatform {
    GITHUB = 'github',
    GITLAB = 'gitlab',
    BITBUCKET = 'bitbucket',
}

export {};

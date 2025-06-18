// Environment Variables Type
export interface EnvironmentVariables {
    NODE_ENV: 'development' | 'production' | 'test' | 'staging';
    PORT: string;
    FRONTEND_URL: string;
    BACKEND_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: number;
    JWT_REFRESH_EXPIRES_IN: number;
    JWT_REFRESH_EXPIRES_IN_REMEMBER: number;
}

export interface OAuthUser {
    id: number;
    googleId: string;
    email: string;
    name: string;
    avatar: string;
    createdAt: Date;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

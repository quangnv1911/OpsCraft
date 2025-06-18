export interface JwtResponse {
    accessToken: string;
    refreshToken: string;
}

export interface UserPayload {
    id: string;
    email: string;
}

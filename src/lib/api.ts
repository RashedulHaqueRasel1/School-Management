/**
 * Shared HTTP client.
 * TODO (backend phase): replace with an Axios instance that attaches the
 * NextAuth access token in a request interceptor and handles 401s.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

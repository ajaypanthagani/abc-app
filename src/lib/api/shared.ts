// Importable from both server and client components.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const apiUrl = (path: string) => `${API_URL}${path}`;

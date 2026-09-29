// Importable from both server and client components.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const apiUrl = (path: string) => `${API_URL}${path}`;

// Server-side fetches (RSC, route handlers) may take a private-network route
// to the API when the host offers one — on Railway that is
// http://<api-service>.railway.internal:<port>, which skips the public edge.
// Browsers always use API_URL. Only import this from server code.
export const SERVER_API_URL = process.env.API_INTERNAL_URL || API_URL;

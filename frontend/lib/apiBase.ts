const envValue = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE = envValue || 'http://localhost:4000/api';

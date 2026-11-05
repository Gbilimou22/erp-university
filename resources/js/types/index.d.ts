import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    platformSettings?: {
        platform_name?: string | null;
        contact_email?: string | null;
        contact_phone?: string | null;
        address?: string | null;
        website?: string | null;
        platform_tagline?: string | null;
        logo_url?: string | null;
        emblem_url?: string | null;
    };
    ziggy: Config & { location: string };
};

import { PUBLIC_SRIRADHAS_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SRIRADHAS_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(PUBLIC_SRIRADHAS_SUPABASE_URL, PUBLIC_SRIRADHAS_SUPABASE_PUBLISHABLE_KEY);


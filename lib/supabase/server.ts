import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // Has full access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

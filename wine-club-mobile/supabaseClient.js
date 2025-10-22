import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oieuxjexqntyekhdzmlj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZXV4amV4cW50eWVraGR6bWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NjUxMjAsImV4cCI6MjA3NjQ0MTEyMH0.ddqdlHM9Seoz4Ocvl47a9PMgpUV5DyJ-w3ix-RRLNqA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
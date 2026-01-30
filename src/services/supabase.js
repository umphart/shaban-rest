import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rupebtixxibrygiylulw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGVidGl4eGlicnlnaXlsdWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjc1MDksImV4cCI6MjA4NDg0MzUwOX0.Y4xk1_lHe_e38idyQNtHA_qv2Oly5YCusVi8SvIHHWs'; // Get from Supabase project settings

export const supabase = createClient(supabaseUrl, supabaseKey);
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://egpuuwquxnehwozcfega.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncHV1d3F1eG5laHdvemNmZWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjQyNzUsImV4cCI6MjA5MTk0MDI3NX0.K05cijgRfOsAucfet6Kr8TRB2u3BtC-qiGuFwpUAE38';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

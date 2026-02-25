// One-time migration: adds host_user_id and host_subaccount_code to properties table
// Run with: node add_host_columns.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://achmoykbgoxlsblyghyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjaG1veWtiZ294bHNibHlnaHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDU2ODYsImV4cCI6MjA4NjEyMTY4Nn0.AQatYRpePjGt9pAOH6g26hUauvDBB4twLvX6ps5G_Mo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { error } = await supabase.rpc('exec_sql', {
    sql: `
    ALTER TABLE properties 
    ADD COLUMN IF NOT EXISTS host_user_id UUID,
    ADD COLUMN IF NOT EXISTS host_subaccount_code TEXT;
  `
});

if (error) {
    console.error('Migration failed:', error.message);
    console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
    console.log(`
    ALTER TABLE properties 
    ADD COLUMN IF NOT EXISTS host_user_id UUID,
    ADD COLUMN IF NOT EXISTS host_subaccount_code TEXT;
  `);
} else {
    console.log('Migration successful!');
}

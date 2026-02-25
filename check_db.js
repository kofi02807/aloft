import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://achmoykbgoxlsblyghyz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjaG1veWtiZ294bHNibHlnaHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDU2ODYsImV4cCI6MjA4NjEyMTY4Nn0.AQatYRpePjGt9pAOH6g26hUauvDBB4twLvX6ps5G_Mo'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log('Checking database connection...')
    const { data, error } = await supabase
        .from('properties')
        .select('*')

    if (error) {
        console.error('Error fetching properties:', error)
    } else {
        console.log('Properties found:', data?.length)
        if (data?.length > 0) {
            console.log('First property:', data[0])
        } else {
            console.log('No properties found in the database.')
        }
    }
}

check()

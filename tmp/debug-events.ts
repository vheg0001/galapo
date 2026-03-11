
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEvents() {
    console.log('Testing events query...');
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('Error fetching events:', error);
        } else {
            console.log('Events table access successful. Sample data:', data);
        }

        const { data: listings, error: listingsError } = await supabase
            .from('listings')
            .select('id')
            .limit(1);
        
        if (listingsError) {
            console.error('Error fetching listings:', listingsError);
        } else {
            console.log('Listings table access successful.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugEvents();

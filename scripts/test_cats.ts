import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl!, supabaseKey!);

async function check() {
    const { data: fields } = await admin.from('category_fields').select('*');
    console.log('Fields:', fields);
}

check();

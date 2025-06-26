require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Load Supabase credentials from environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const search = (event.queryStringParameters?.search || '').trim().toLowerCase();

  let query = supabase
    .from('executives')
    .select('id, name, title, current_company, profile_picture, votes');

  if (search) {
    // Use ilike for case-insensitive pattern matching (PostgreSQL specific)
    query = query.or(
      `name.ilike.%${search}%,title.ilike.%${search}%,current_company.ilike.%${search}%`
    );
  }

  const { data, error } = await query.order('votes', { ascending: false });

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const { page = 1, limit = 20 } = event.queryStringParameters;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('executives')
    .select('*', { count: 'exact' })
    .order('votes', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  const totalPages = Math.ceil(count / limit);

  return {
    statusCode: 200,
    body: JSON.stringify({
      profiles: data,
      totalPages,
    }),
  };
};

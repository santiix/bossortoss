require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const APOLLO_KEY = process.env.APOLLO_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function (event) {
  try {
    const { company, role } = JSON.parse(event.body);

    if (
      !company || !role ||
      company.trim().length < 2 ||
      role.trim().length < 2
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid input: company and role required' })
      };
    }

    const response = await axios.post(
      'https://api.apollo.io/v1/mixed_people/search',
      {
        person_titles: [role.trim()],
        q_organization_name: company.trim(),
        per_page: 25 // pull more than 1 match per role
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_KEY
        }
      }
    );

    const people = response.data.people || [];

    if (people.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `No ${role} found for ${company}` })
      };
    }

    let inserted = [];
    let skipped = [];

    for (const person of people) {
      const { data: existing } = await supabase
        .from('executives')
        .select('id')
        .eq('linkedin_url', person.linkedin_url)
        .maybeSingle();

      if (existing) {
        skipped.push(person.linkedin_url);
        continue;
      }

      const history = (person.employment_history || []).map(job => ({
        company: job.name,
        title: job.title,
        years: `${job.start_date || '?'}–${job.end_date || 'Present'}`
      }));

      const { data, error } = await supabase
        .from('executives')
        .insert([{
          name: person.name || null,
          title: person.title || null,
          current_company: person.organization?.name || company,
          linkedin_url: person.linkedin_url || null,
          profile_picture: person.photo_url || null,
          ingested_at: new Date().toISOString(),
          past_companies: history
        }], {
          ignoreDuplicates: true
        });

      if (error) {
        console.warn(`Insert error for ${person.name}:`, error.message);
      } else {
        inserted.push(data?.[0]);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        insertedCount: inserted.length,
        skippedCount: skipped.length
      })
    };
  } catch (err) {
    return {
      statusCode: err.response?.status || 500,
      body: JSON.stringify({
        error: err.message,
        details: err.response?.data || {}
      })
    };
  }
};

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  try {
    const { id, type } = JSON.parse(event.body);
    const ip = event.headers['x-forwarded-for'] || 'unknown';

    // Check if this IP already voted today
    const { data: existingVotes, error: voteCheckErr } = await supabase
      .from('votes')
      .select('id')
      .eq('profile_id', id)
      .eq('ip_address', ip)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    if (voteCheckErr) {
      console.error('Vote check error:', voteCheckErr.message);
      return { statusCode: 500, body: JSON.stringify({ error: voteCheckErr.message }) };
    }

    if (existingVotes.length > 0) {
      return {
        statusCode: 429,
        body: JSON.stringify({ message: 'You already voted today.' })
      };
    }

    const { error: insertErr } = await supabase.from('votes').insert({
      profile_id: id,
      vote_type: type,
      ip_address: ip
    });

    if (insertErr) {
      console.error('Insert vote error:', insertErr.message);
      return { statusCode: 500, body: JSON.stringify({ error: insertErr.message }) };
    }

    const { data: allVotes, error: fetchVotesErr } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('profile_id', id);

    if (fetchVotesErr) {
      console.error('Fetch votes error:', fetchVotesErr.message);
      return { statusCode: 500, body: JSON.stringify({ error: fetchVotesErr.message }) };
    }

    const score = allVotes.reduce((acc, vote) => {
      if (vote.vote_type === 'up') return acc + 1;
      if (vote.vote_type === 'down') return acc - 1;
      return acc;
    }, 0);

    const { error: updateErr } = await supabase
      .from('executives')
      .update({ votes: score })
      .eq('id', id);

    if (updateErr) {
      console.error('Update exec error:', updateErr.message);
      return { statusCode: 500, body: JSON.stringify({ error: updateErr.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, votes: score }) };
  } catch (err) {
    console.error('Handler error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Unknown error' }) };
  }
};

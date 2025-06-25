import { useEffect, useState } from 'react';

const itemsPerPage = 20;

export default function Home() {
  const [profiles, setProfiles] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Fetch all profiles once to calculate top boss and toss
    fetch(`/.netlify/functions/get-profiles?page=1&limit=10000`)
      .then((res) => res.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : data.profiles;
        if (Array.isArray(all)) {
          setAllProfiles(all);
        }
      });
  }, []);

  useEffect(() => {
    // Fetch paginated profiles
    fetch(`/.netlify/functions/get-profiles?page=${page}&limit=${itemsPerPage}`)
      .then((res) => res.json())
      .then((data) => {
        const returnedProfiles = Array.isArray(data) ? data : data.profiles;
        if (Array.isArray(returnedProfiles)) {
          setProfiles(returnedProfiles);
          setTotalPages(data.totalPages || 1);
        } else {
          setProfiles([]);
          setTotalPages(1);
        }
      })
      .catch(() => {
        setProfiles([]);
        setTotalPages(1);
      });
  }, [page]);

  const filteredProfiles = Array.isArray(profiles)
    ? profiles.filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))
    : [];

  const uniqueAllProfiles = allProfiles.filter((p, index, self) => index === self.findIndex((t) => t.id === p.id));
  const topBoss = [...uniqueAllProfiles].sort((a, b) => b.votes - a.votes)[0];
  const topToss = [...uniqueAllProfiles].filter(p => p.id !== topBoss?.id).sort((a, b) => a.votes - b.votes)[0];

  return (
    <div>
      <header>
        <h1>Boss or Toss</h1>
      </header>

      <section style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '20px 0' }}>
        {topBoss && <TopCard title="BOSS!" profile={topBoss} />}
        {topToss && <TopCard title="TOSS!" profile={topToss} />}
      </section>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      <section>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
          {filteredProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      </section>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', borderTop: '1px solid #ccc' }}>
        <p>&copy; {new Date().getFullYear()} Boss or Toss. All rights reserved.</p>
      </footer>
    </div>
  );
}

function ProfileCard({ profile }) {
  return (
    <div style={{ width: '250px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
      <img
        src={profile.profile_picture || '/default-avatar.png'}
        alt={profile.name}
        style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '8px' }}
      />
      <h3>{profile.name}</h3>
      <p>{profile.title}</p>
      <p>{profile.current_company}</p>
    </div>
  );
}

function TopCard({ title, profile }) {
  return (
    <div style={{ width: '250px', padding: '16px', border: '2px solid #000', borderRadius: '10px', textAlign: 'center', backgroundColor: title === 'BOSS!' ? '#e0ffe0' : '#ffe0e0' }}>
      <h2>{title}</h2>
      <img
        src={profile.profile_picture || '/default-avatar.png'}
        alt={profile.name}
        style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '8px' }}
      />
      <h3>{profile.name}</h3>
      <p>{profile.title}</p>
      <p>{profile.current_company}</p>
    </div>
  );
}

function Pagination({ page, totalPages, setPage }) {
  return (
    <div style={{ textAlign: 'center', margin: '16px 0' }}>
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
        Prev
      </button>
      <span style={{ margin: '0 8px' }}>
        Page {page} of {totalPages}
      </span>
      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
        Next
      </button>
    </div>
  );
}

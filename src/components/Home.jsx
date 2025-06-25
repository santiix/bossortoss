import { useEffect, useState, useRef } from 'react';

fetch('/.netlify/functions/get-profiles-with-votes')

const itemsPerPage = 20;

export default function Home() {
  const [profiles, setProfiles] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const loadingRef = useRef(false);

const fetchAllProfiles = () => {
  fetch(`/.netlify/functions/get-profiles-with-votes`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setAllProfiles(data);
      }
    })
    .catch((err) => console.error('Error fetching profiles with votes', err));
};


  useEffect(() => {
    // Initial full profile load for top cards
    fetchAllProfiles();
  }, []);

  useEffect(() => {
    // Load initial page
    loadProfiles(page);
  }, []);

  const loadProfiles = (currentPage) => {
    loadingRef.current = true;
    fetch(`/.netlify/functions/get-profiles?page=${currentPage}&limit=${itemsPerPage}`)
      .then((res) => res.json())
      .then((data) => {
        const returnedProfiles = Array.isArray(data) ? data : data.profiles;
        if (Array.isArray(returnedProfiles)) {
          setProfiles((prev) => [...prev, ...returnedProfiles]);
          if (returnedProfiles.length < itemsPerPage) setHasMore(false);
        } else {
          setHasMore(false);
        }
      })
      .catch(() => setHasMore(false))
      .finally(() => {
        setTimeout(() => {
          loadingRef.current = false;
        }, 2500); // 2.5s delay before allowing the next load
      });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadProfiles(nextPage);
        }
      },
      { rootMargin: '100px' }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [hasMore, page]);

  const handleVote = async (id, type) => {
    const res = await fetch('/.netlify/functions/vote-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type })
    });

    if (res.status === 200) {
      alert('Thanks for your vote!');
      fetchAllProfiles(); // Reload top card data
    } else if (res.status === 429) {
      alert('You can only vote once per day for this profile. Thanks for participating!');
    } else {
      alert('Something went wrong. Please try again later.');
    }
  };

  const filteredProfiles = Array.isArray(profiles)
    ? profiles.filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))
    : [];

  const uniqueAllProfiles = allProfiles.filter((p, index, self) => index === self.findIndex((t) => t.id === p.id));
const topBoss = [...uniqueAllProfiles].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
const topToss = [...uniqueAllProfiles].filter(p => p.id !== topBoss?.id).sort((a, b) => (a.votes || 0) - (b.votes || 0))[0];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header>
        <h1>Boss or Toss</h1>
      </header>

      <section style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '20px 0' }}>
        {topBoss && <TopCard title="BOSS!" profile={topBoss} />}
        {topToss && <TopCard title="TOSS!" profile={topToss} />}
      </section>

      <section>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
          {filteredProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} onVote={handleVote} />
          ))}
        </div>
        <div ref={observerRef} style={{ height: '1px' }}></div>
      </section>

      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', borderTop: '1px solid #ccc' }}>
        <p>&copy; {new Date().getFullYear()} Boss or Toss. All rights reserved.</p>
      </footer>
    </div>
  );
}

function ProfileCard({ profile, onVote }) {
  const imageSrc = profile.profile_picture && profile.profile_picture.trim() !== '' ? profile.profile_picture : '/default-avatar.png';
  return (
    <div style={{ width: '250px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center', position: 'relative' }}>
      <img
        src={imageSrc}
        alt={profile.name}
        style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '8px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
        <button title="Vote Boss" onClick={() => onVote(profile.id, 'up')} style={{ fontSize: '20px', cursor: 'pointer' }}>👍</button>
        <button title="Vote Toss" onClick={() => onVote(profile.id, 'down')} style={{ fontSize: '20px', cursor: 'pointer' }}>👎</button>
      </div>
      <h3>{profile.name}</h3>
      <p>{profile.title}</p>
      <p>{profile.current_company}</p>
    </div>
  );
}

function TopCard({ title, profile }) {
  const imageSrc = profile.profile_picture && profile.profile_picture.trim() !== '' ? profile.profile_picture : '/default-avatar.png';
  return (
    <div style={{ width: '250px', padding: '16px', border: '2px solid #000', borderRadius: '10px', textAlign: 'center', backgroundColor: title === 'BOSS!' ? '#e0ffe0' : '#ffe0e0' }}>
      <h2>{title}</h2>
      <img
        src={imageSrc}
        alt={profile.name}
        style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '8px' }}
      />
      <h3>{profile.name}</h3>
      <p>{profile.title}</p>
      <p>{profile.current_company}</p>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import TopNav from '../components/TopNav';
import '../styles/global.css';

const itemsPerPage = 20;

export default function Home() {
  const [profiles, setProfiles] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingTop, setIsLoadingTop] = useState(true);
  const observerRef = useRef(null);
  const loadingRef = useRef(false);

  const fetchAllProfiles = () => {
    setIsLoadingTop(true);
    fetch(`/.netlify/functions/get-profiles-with-votes`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllProfiles(data);
        }
      })
      .catch((err) => console.error('Error fetching profiles with votes', err))
      .finally(() => setIsLoadingTop(false));
  };

  useEffect(() => {
    fetchAllProfiles();
  }, []);

  useEffect(() => {
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
        }, 2000);
      });
  };

  useEffect(() => {
    if (search.trim() === '') {
      setProfiles([]);
      setPage(1);
      setHasMore(true);
      loadProfiles(1);
      return;
    }

    fetch(`/.netlify/functions/get-profiles-with-votes?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProfiles(data);
          setHasMore(false);
        }
      })
      .catch(console.error);
  }, [search]);

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
      fetchAllProfiles();
    } else if (res.status === 429) {
      alert('You can only vote once per day for this profile. Thanks for participating!');
    } else {
      alert('Something went wrong. Please try again later.');
    }
  };

  const filteredProfiles = Array.isArray(profiles)
    ? profiles
        .filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))
        .filter((p) =>
          `${p.name} ${p.title} ${p.current_company}`.toLowerCase().includes(search.toLowerCase())
        )
    : [];

  const uniqueAllProfiles = allProfiles.filter(
    (p, index, self) => index === self.findIndex((t) => t.id === p.id)
  );

  const profilesWithImages = uniqueAllProfiles.filter((p) => {
    const url = p.profile_picture?.toLowerCase() || '';
    return (
      url &&
      !url.includes('default-avatar') &&
      (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.includes('profile-displayphoto')) &&
      !url.includes('silhouette')
    );
  });

  const profilesWithoutImages = uniqueAllProfiles.filter(
    (p) => !p.profile_picture || p.profile_picture.includes('default-avatar')
  );

  const weightedProfiles = [
    ...profilesWithImages.slice(0, Math.floor(uniqueAllProfiles.length * 0.7)),
    ...profilesWithoutImages
  ];

  const topBoss = [...weightedProfiles].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
  const topToss = [...weightedProfiles]
    .filter((p) => p.id !== topBoss?.id)
    .sort((a, b) => (a.votes || 0) - (b.votes || 0))[0];

  return (     
    <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: '#fff',
        width: '100%',
        borderBottom: '1px solid #ccc',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <TopNav search={search} setSearch={setSearch} />
      </div>

<section style={{ paddingTop: '30px', paddingBottom: '20px' }}>
  <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Top Boss & Toss</h2>
  {isLoadingTop ? (
    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  ) : (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        margin: '0 auto',
        maxWidth: '100%'
      }}
    >
      {topBoss && <TopCard title="BOSS!" profile={topBoss} />}
      {topToss && <TopCard title="TOSS!" profile={topToss} />}
    </div>
  )}
  <hr style={{ marginTop: '30px', marginBottom: '30px', borderTop: '2px solid #ccc' }} />
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
    <div className="profile-card" style={{ width: '200px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center', position: 'relative', height: 'auto' }}>
      <img
        className="profile-img"
        src={imageSrc}
        alt={profile.name}
        width={200}
        height={200}
        style={{ objectFit: 'cover', borderRadius: '8px' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/default-avatar.png';
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
        <button title="Vote Boss" onClick={() => onVote(profile.id, 'up')} style={{ fontSize: '20px', cursor: 'pointer' }}>👍</button>
        <button title="Vote Toss" onClick={() => onVote(profile.id, 'down')} style={{ fontSize: '20px', cursor: 'pointer' }}>👎</button>
      </div>
      <h3 style={{ margin: '6px 0 4px 0' }}>{profile.name}</h3>
      <p style={{ margin: '0 0 4px 0' }}>{profile.title}</p>
      <p style={{ margin: 0, fontWeight: 'bold' }}>Current Company: {profile.current_company}</p>
    </div>
  );
}

function TopCard({ title, profile }) {
  const imageSrc = profile.profile_picture && profile.profile_picture.trim() !== '' ? profile.profile_picture : '/default-avatar.png';
  return (
    <div className="top-card" style={{ width: '200px', padding: '10px', border: '2px solid #000', borderRadius: '10px', textAlign: 'center', backgroundColor: title === 'BOSS!' ? '#e0ffe0' : '#ffe0e0' }}>
      <h2>{title}</h2>
      <img
        className="profile-img"
        src={imageSrc}
        alt={profile.name}
        width={200}
        height={200}
        style={{ objectFit: 'cover', borderRadius: '8px' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/default-avatar.png';
        }}
      />
      <h3 style={{ margin: '6px 0 4px 0' }}>{profile.name}</h3>
      <p style={{ margin: '0 0 4px 0' }}>{profile.title}</p>
      <p style={{ margin: 0, fontWeight: 'bold' }}>Current Company: {profile.current_company}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      width: '200px',
      height: '280px',
      backgroundColor: '#eee',
      borderRadius: '10px',
      animation: 'pulse 1.5s infinite',
    }}>
      <style>
        {`@keyframes pulse {
          0% { background-color: #eee; }
          50% { background-color: #ddd; }
          100% { background-color: #eee; }
        }`}
      </style>
    </div>
  );
}


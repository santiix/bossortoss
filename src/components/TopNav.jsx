export default function TopNav({ search, setSearch }) {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>👔 Boss or Toss</div>

      <input
        type="text"
        placeholder="Search name or company..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #ddd',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '18px',
    whiteSpace: 'nowrap',
  },
  search: {
    flex: 1,
    maxWidth: '400px',
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
};

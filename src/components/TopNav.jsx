import React, { useState } from 'react';

export default function TopNav({ search, setSearch }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="topbar">
      {/* Left: Logo */}
      <div className="left-logo">
        <img src="/logo.png" alt="logo" className="logo" />
      </div>

      {/* Right: Search toggle + input */}
      <div className="right-controls">
        {showSearch && (
          <input
            type="text"
            className="search-input"
            placeholder="Companies & Executives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        <button
          className="search-icon"
          onClick={() => setShowSearch(!showSearch)}
          title="Toggle Search"
        >
          🔍
        </button>
      </div>
    </div>
  );
}

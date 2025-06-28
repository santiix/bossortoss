import React, { useState } from 'react';

export default function TopNav({ search, setSearch }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="topnav-container">
      {/* Spacer to help center the logo */}
      <div className="spacer" />

      {/* Centered logo */}
      <div className="centered-logo">
        <img src="/logo.png" alt="logo" className="logo" />
      </div>

      {/* Right-side controls: Search button + conditional input */}
      <div className="right-controls">
        {showSearch && (
          <input
            type="text"
            className="search-input"
            placeholder="Search bosses..."
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

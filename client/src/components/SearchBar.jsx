import React, { useState } from 'react';
import './css/SearchBar.css';
import { chatApi } from '../apis';

const SearchBar = () => {
  const [searchResult, setSearchResult] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (!value.trim()) { setSearchResult([]); return; }
    try {
      const response = await chatApi.get('/search', { params: { searchQuery: value } });
      if (response.data) setSearchResult(response.data.searchResult);
    } catch { /* silent */ }
  };

  const handleClear = () => { setSearchInput(''); setSearchResult([]); };

  return (
    <nav className='SearchBar'>
      <h1 className='searchbar-title'>Social <span>Sphere</span></h1>

      <div className='search-input-wrap'>
        <i className='fa-solid fa-magnifying-glass search-icon' />
        <input
          type='text'
          placeholder='Search users...'
          value={searchInput}
          autoComplete='off'
          onChange={handleSearch}
        />
        {searchInput && (
          <button className='clear-search' onClick={handleClear} aria-label='Clear search'>
            <i className='fa-solid fa-xmark' />
          </button>
        )}
      </div>

      {searchResult.length > 0 && (
        <div className='Search-Results-Container'>
          <ul>
            {searchResult.map((user, index) => (
              <li key={index}>
                <div className='search-result-avatar'>
                  <i className='fa-solid fa-user' />
                </div>
                <h2>{user.username}</h2>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default SearchBar;

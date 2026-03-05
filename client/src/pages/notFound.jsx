import React from 'react';
import { Link } from 'react-router-dom';
import './css/notFound.css';

const NotFound = () => {
  return (
    <div className='Not-Found'>
      <div className='not-found-code' aria-hidden="true">404</div>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to='/' className='not-found-link'>
        <i className="fa-solid fa-arrow-left" /> Back to Home
      </Link>
    </div>
  );
};

export default NotFound;

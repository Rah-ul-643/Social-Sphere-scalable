import React from 'react';

const Loader = ({ loaderImage, imageClasses, content, divClasses }) => {
  return (
    <div className={divClasses}>
      {loaderImage && <img src={loaderImage} className={imageClasses} alt='Loading...' />}
      {content && <span>{content}</span>}
    </div>
  );
};

export default Loader;

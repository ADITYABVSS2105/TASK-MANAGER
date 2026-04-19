import React from 'react';

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
};

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  return (
    <div className={`${sizes[size]} rounded-full border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 animate-spin ${className}`} />
  );
};

export default LoadingSpinner;

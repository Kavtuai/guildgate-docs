import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import DocSearch from '../components/DocSearch';

export default function Root({children}) {
  return (
    <>
      <DocSearch />
      {children}
    </>
  );
}

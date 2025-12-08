import React from 'react'
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';


const App = () => {
  return (
    <Routes>
      <Route>
        <Route path="/" element={<Layout />} />
      </Route>
    </Routes>
  )
}

export default App
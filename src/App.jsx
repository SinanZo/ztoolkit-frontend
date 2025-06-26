import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n';
import './index.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Tools from './pages/Tools';
import Pricing from './pages/Pricing';

function App() {
  return (
    <Router>
      <Navbar />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

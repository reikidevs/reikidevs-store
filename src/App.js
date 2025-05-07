import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Products from './components/Products';
import Footer from './components/Footer';
import AdminRoutes from './AdminRoutes';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Admin routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />
            
            {/* Public routes */}
            <Route path="/" element={
              <>
                <Header />
                <main>
                  <Hero />
                  <Products />
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

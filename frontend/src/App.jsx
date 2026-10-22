import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import ScrollToTop from './components/common/ScrollToTop';

// Pages
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SelectShowtime from './pages/SelectShowtime';
import SelectSeats from './pages/SelectSeats';
import BookingSummary from './pages/BookingSummary';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const AppLayout = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/organizer') || location.pathname.startsWith('/admin');

  return (
    <div className="app-layout-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/theatres/:movieId" element={<SelectShowtime />} />
          <Route path="/book/:movieId" element={<SelectShowtime />} />
          <Route path="/select-seats" element={<SelectSeats />} />
          <Route path="/select-seats/:theatreId" element={<SelectSeats />} />
          <Route path="/booking-summary" element={<BookingSummary />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
      <Toast />
    </div>
  );
};

function App() {
  return (
    <BookingProvider>
      <Router>
        <AppLayout />
      </Router>
    </BookingProvider>
  );
}

export default App;

import { Routes, Route } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';

function App() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;

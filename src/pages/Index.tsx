
import { useState } from 'react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { DirectoryGrid } from '../components/DirectoryGrid';
import { Footer } from '../components/Footer';
import { EditingPanel } from '../components/EditingPanel';

const Index = () => {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header editMode={editMode} onToggleEdit={() => setEditMode(!editMode)} />
      
      {/* Hero Section with Error Boundary */}
      <div className="error-boundary">
        <HeroSection editMode={editMode} />
      </div>
      
      {/* Directory Grid with Error Boundary */}
      <div className="error-boundary">
        <DirectoryGrid editMode={editMode} />
      </div>
      
      {/* Footer with Error Boundary */}
      <div className="error-boundary">
        <Footer editMode={editMode} />
      </div>
      
      {editMode && <EditingPanel />}
    </div>
  );
};

export default Index;

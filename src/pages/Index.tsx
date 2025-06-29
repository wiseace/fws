
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
      <HeroSection editMode={editMode} />
      <DirectoryGrid editMode={editMode} />
      <Footer editMode={editMode} />
      {editMode && <EditingPanel />}
    </div>
  );
};

export default Index;

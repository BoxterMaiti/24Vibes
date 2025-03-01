import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CategoryFilter from '../components/CategoryFilter';
import CardGrid from '../components/CardGrid';
import CardModal from '../components/CardModal';
import PageTransition from '../components/PageTransition';
import { CardTemplate, CategoryType } from '../types';
import { loadTemplates } from '../services/vibeService';

const CreateCardPage: React.FC = () => {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories: CategoryType[] = ['All', 'Excellence', 'Leadership', 'Positivity', 'Showing up', 'Team Player'];

  useEffect(() => {
    // Load card templates from the service
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const templatesData = await loadTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category);
  };

  const handleSelectCard = (template: CardTemplate | null, category?: string) => {
    setSelectedTemplate(template);
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pt-4">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to home
          </Link>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create a Vibe Card</h2>
            
            <CategoryFilter 
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
            
            <CardGrid 
              templates={templates}
              activeCategory={activeCategory}
              onSelectCard={handleSelectCard}
            />
          </div>
        </div>

        {/* Card Modal */}
        <CardModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          template={selectedTemplate}
          category={selectedCategory}
        />
      </div>
    </PageTransition>
  );
};

export default CreateCardPage;
import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { CardTemplate, CategoryType, categoryBackgroundColors, categoryColors } from '../types';
import Card3D from './Card3D';

interface CardGridProps {
  templates: CardTemplate[];
  activeCategory: CategoryType;
  onSelectCard: (template: CardTemplate | null, category?: string) => void;
}

const CardGrid: React.FC<CardGridProps> = ({ templates, activeCategory, onSelectCard }) => {
  // Use useMemo to ensure templates are only filtered and shuffled when dependencies change
  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'All') {
      // For "All" category, get all templates from all categories
      const allTemplates: { template: CardTemplate; category: string }[] = [];
      
      // Get all categories except "All"
      const categories = Object.keys(categoryBackgroundColors).filter(
        cat => cat !== 'All'
      ) as CategoryType[];
      
      // For each template, check all categories and add valid combinations
      templates.forEach(template => {
        categories.forEach(category => {
          const content = template[category as keyof CardTemplate];
          if (content && content.trim() !== '') {
            allTemplates.push({
              template,
              category
            });
          }
        });
      });
      
      // Shuffle the array to randomize the order - only happens when dependencies change
      return allTemplates.sort(() => Math.random() - 0.5);
    } else {
      // For specific category, get all templates that have content for that category
      return templates
        .filter(template => 
          template[activeCategory as keyof CardTemplate] && 
          template[activeCategory as keyof CardTemplate]!.trim() !== ''
        )
        .map(template => ({
          template,
          category: activeCategory
        }));
    }
  }, [templates, activeCategory]); // Only recalculate when these dependencies change

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Start from scratch card - always first */}
      <Card3D>
        <div 
          className="border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center h-64 cursor-pointer hover:shadow-md transition-shadow bg-white"
          onClick={() => onSelectCard(null)}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-gray-600 font-medium">Start from scratch</p>
        </div>
      </Card3D>

      {/* Template cards */}
      {filteredTemplates.map((item, index) => {
        const { template, category } = item;
        const message = template[category as keyof CardTemplate] as string;
        const bgColorClass = categoryBackgroundColors[category as CategoryType];
        
        return (
          <Card3D key={`${category}-${template.id || index}`}>
            <div
              className={`${bgColorClass} rounded-lg p-6 flex flex-col justify-between h-64 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onSelectCard(template, category)}
            >
              <p className="text-gray-800 text-lg font-medium">{message}</p>
              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${categoryColors[category as CategoryType]}`}>
                  {category}
                </span>
              </div>
            </div>
          </Card3D>
        );
      })}
    </div>
  );
};

export default CardGrid;
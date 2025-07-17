
import { 
  Briefcase, 
  Palette, 
  Wrench, 
  Camera, 
  Car, 
  Scissors, 
  Hammer, 
  ChefHat,
  Broom,
  GraduationCap,
  Zap,
  Music,
  Flower,
  Heart,
  Home,
  Brush,
  Image,
  Cog,
  Truck,
  BookOpen
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: string[];
}

const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: any } = {
    'All': Briefcase,
    'Professional Services': Briefcase,
    'Creative Services': Palette,
    'Plumbing': Wrench,
    'Beauty & Personal Care': Scissors,
    'Automotive': Car,
    'Beauty': Scissors,
    'Carpentry': Hammer,
    'Catering': ChefHat,
    'Cleaning': Broom,
    'Education': GraduationCap,
    'Electrical': Zap,
    'Events & Entertainment': Music,
    'Gardening': Flower,
    'Health & Wellness': Heart,
    'Home Services': Home,
    'Painting': Brush,
    'Photography': Camera,
    'Pottery': Cog,
    'Tailoring': Scissors,
    'Tech Repair': Cog,
    'Technology': Cog,
    'Transportation': Truck,
    'Tutoring': BookOpen
  };
  
  return iconMap[category] || Briefcase;
};

export const CategoryFilter = ({ selectedCategory, onCategoryChange, categories }: CategoryFilterProps) => {
  const defaultCategories = [
    'All', 'Professional Services', 'Creative Services', 'Plumbing', 
    'Beauty & Personal Care', 'Automotive', 'Beauty', 'Carpentry',
    'Catering', 'Cleaning', 'Education', 'Electrical', 
    'Events & Entertainment', 'Gardening', 'Health & Wellness', 
    'Home Services', 'Painting', 'Photography', 'Pottery', 
    'Tailoring', 'Tech Repair', 'Technology', 'Transportation', 'Tutoring'
  ];
  
  const availableCategories = categories ? ['All', ...categories] : defaultCategories;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 max-w-6xl mx-auto">
      {availableCategories.map((category) => {
        const IconComponent = getCategoryIcon(category);
        const isSelected = selectedCategory === category;
        
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`group flex flex-col items-center p-6 rounded-2xl transition-all duration-200 hover:scale-105 ${
              isSelected
                ? 'bg-white shadow-lg ring-2 ring-primary'
                : 'bg-white/50 hover:bg-white hover:shadow-md'
            }`}
          >
            <div className={`p-3 rounded-xl mb-3 transition-colors ${
              isSelected 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-600 group-hover:bg-primary group-hover:text-white'
            }`}>
              <IconComponent className="w-6 h-6" />
            </div>
            
            <span className={`text-sm font-medium text-center leading-tight ${
              isSelected 
                ? 'text-primary' 
                : 'text-gray-700 group-hover:text-primary'
            }`}>
              {category}
            </span>
          </button>
        );
      })}
    </div>
  );
};

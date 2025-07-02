
interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: string[];
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange, categories }: CategoryFilterProps) => {
  const defaultCategories = ['All', 'Design', 'Technology', 'Consulting', 'Photography', 'Writing', 'Coaching'];
  const availableCategories = categories ? ['All', ...categories] : defaultCategories;
  
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {availableCategories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === category
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

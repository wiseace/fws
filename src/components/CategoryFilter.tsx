
const categories = ['All', 'Design', 'Technology', 'Consulting', 'Photography', 'Writing', 'Coaching'];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((category) => (
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

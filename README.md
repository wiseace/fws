
# FindWho - Professional Directory Clone

A modern, fully editable professional directory website with visual editing capabilities and Supabase integration.

## Features

- 🎨 **Visual Editor**: Inline editing of text, images, and content
- 📱 **Responsive Design**: Works perfectly on all devices
- 🔍 **Advanced Search**: Filter by category, location, and keywords
- ⭐ **Professional Profiles**: Detailed profile cards with ratings and verification
- 🎯 **Category Filtering**: Easy navigation through different professional categories
- 🔧 **Live Editing Panel**: Built-in CMS-style admin interface
- 🗄️ **Supabase Ready**: Structure prepared for database integration

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: Supabase (ready for integration)
- **Deployment**: Vercel/Netlify ready

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd findwho-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:8080`

## Editing Guide

### Visual Editing Mode
1. Click the "Edit Mode" button in the header
2. Click on any text element to edit it inline
3. Use the editing panel on the right for advanced options
4. Exit edit mode to see the final result

### Adding New Profiles
1. Enable edit mode
2. Scroll to the directory section
3. Click "Add New Profile" button
4. Fill in the profile details

### Customizing Design
1. Open the editing panel
2. Go to the "Design" tab
3. Modify colors, typography, and layout options

## Supabase Integration

To connect with Supabase for dynamic content management:

1. **Set up Supabase project**
2. **Create profiles table**:
   ```sql
   CREATE TABLE profiles (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     title VARCHAR(255) NOT NULL,
     bio TEXT,
     location VARCHAR(255),
     image_url TEXT,
     category VARCHAR(100),
     rating DECIMAL(2,1),
     verified BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Configure environment variables**
4. **Enable real-time sync**

## Deployment

### GitHub Integration
1. Connect your GitHub account in Lovable
2. Push changes automatically sync
3. Set up GitHub Actions for CI/CD

### Hosting Options
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag and drop build folder or connect Git
- **Custom hosting**: Build with `npm run build`

## Customization

### Color Scheme
Modify the color palette in `tailwind.config.ts` or use the visual editor.

### Layout Components
All components are modular and can be easily rearranged:
- `Header` - Navigation and branding
- `HeroSection` - Main banner with search
- `DirectoryGrid` - Profile listings
- `ProfileCard` - Individual profile display
- `Footer` - Site footer

### Content Management
- Edit content directly in the browser
- Add/remove sections with the editing panel
- Manage profiles through the admin interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact support

## License

This project is licensed under the MIT License.

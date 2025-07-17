
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const findWhoSabiLogo = '/lovable-uploads/60f0692e-43cf-498a-bf01-0e645aa4348e.png';

interface FooterProps {
  editMode: boolean;
}

export const Footer = ({ editMode }: FooterProps) => {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-8 border-b border-gray-800">
          <div className="mb-6 md:mb-0">
            <img src={findWhoSabiLogo} alt="FindWhoSabi" className="h-8 w-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Get updates on FindWhoSabi:</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Input 
              type="email" 
              placeholder="Email Address"
              className="bg-transparent border-gray-700 text-white placeholder-gray-400 focus:border-white min-w-[250px]"
            />
            <Button className="bg-white hover:bg-gray-100 text-black font-semibold px-6 rounded-full">
              →
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Services</h3>
            <ul className="space-y-2">
              <li><a href="/browse?category=plumbing" className="text-gray-300 hover:text-white transition-colors">Plumbing</a></li>
              <li><a href="/browse?category=electrical" className="text-gray-300 hover:text-white transition-colors">Electrical</a></li>
              <li><a href="/browse?category=cleaning" className="text-gray-300 hover:text-white transition-colors">Cleaning</a></li>
              <li><a href="/browse?category=carpentry" className="text-gray-300 hover:text-white transition-colors">Carpentry</a></li>
              <li><a href="/browse?category=beauty" className="text-gray-300 hover:text-white transition-colors">Beauty</a></li>
              <li><a href="/browse?category=catering" className="text-gray-300 hover:text-white transition-colors">Catering</a></li>
              <li><a href="/browse" className="text-gray-300 hover:text-white transition-colors">View All Services</a></li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Learn</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Resources</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Interactive Demo</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Watch in 90 seconds</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Case Studies</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">For Providers</h3>
            <ul className="space-y-2">
              <li><a href="/auth" className="text-gray-300 hover:text-white transition-colors">Create Account</a></li>
              <li><a href="/dashboard" className="text-gray-300 hover:text-white transition-colors">Provider Dashboard</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Verification Process</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Payment Protection</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Service Analytics</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Marketing Tools</a></li>
            </ul>
          </div>

          {/* For Customers */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">For Customers</h3>
            <ul className="space-y-2">
              <li><a href="/auth" className="text-gray-300 hover:text-white transition-colors">Account Login</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">How to Find Services</a></li>
              <li><a href="/browse" className="text-gray-300 hover:text-white transition-colors">Browse the Network</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Safety & Security</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Quality Guarantee</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Our Story</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Team</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">News & Press</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Support Center</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Partner Program</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Media Kit</a></li>
            </ul>

            {/* Contact Section */}
            <div className="mt-8">
              <h4 className="text-md font-semibold mb-3 text-white">Contact</h4>
              <ul className="space-y-2">
                <li><a href="mailto:support@findwhosabi.com" className="text-gray-300 hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="mailto:sales@findwhosabi.com" className="text-gray-300 hover:text-white transition-colors">Contact Sales</a></li>
                <li><a href="mailto:info@findwhosabi.com" className="text-gray-300 hover:text-white transition-colors">General Inquiries</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap gap-6 mb-4 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Legal</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</a>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">LinkedIn</a>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              © 2024 FindWhoSabi, Inc.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

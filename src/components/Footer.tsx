
import { Facebook, Twitter, Instagram, Linkedin, Mail, Shield, CheckCircle, Star, Users, Award, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const findWhoSabiLogo = '/lovable-uploads/60f0692e-43cf-498a-bf01-0e645aa4348e.png';

interface FooterProps {
  editMode: boolean;
}

export const Footer = ({ editMode }: FooterProps) => {
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-800">
          <div className="mb-4 md:mb-0">
            <img src={findWhoSabiLogo} alt="FindWhoSabi" className="h-8 w-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Get updates on FindWhoSabi:</h3>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About & Social Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">About Us</h3>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Connect with verified skilled professionals across Nigeria. From plumbing to beauty services, 
              find trusted experts in your area.
            </p>
            
            {/* Trust Indicators */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2 text-gray-300 text-xs">
                <Shield className="h-3 w-3 text-green-400" />
                <span>Verified Professionals</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-xs">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-xs">
                <Star className="h-3 w-3 text-yellow-400" />
                <span>Rated Services</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-1.5 bg-gray-800 rounded-full hover:bg-gray-700">
                <Facebook className="h-3 w-3" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-1.5 bg-gray-800 rounded-full hover:bg-gray-700">
                <Twitter className="h-3 w-3" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-1.5 bg-gray-800 rounded-full hover:bg-gray-700">
                <Instagram className="h-3 w-3" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-1.5 bg-gray-800 rounded-full hover:bg-gray-700">
                <Linkedin className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Services & Learn Combined */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">Services</h3>
            <ul className="space-y-1.5 mb-4">
              <li><a href="/browse?category=plumbing" className="text-gray-300 hover:text-white transition-colors text-sm">Plumbing</a></li>
              <li><a href="/browse?category=electrical" className="text-gray-300 hover:text-white transition-colors text-sm">Electrical</a></li>
              <li><a href="/browse?category=cleaning" className="text-gray-300 hover:text-white transition-colors text-sm">Cleaning</a></li>
              <li><a href="/browse?category=beauty" className="text-gray-300 hover:text-white transition-colors text-sm">Beauty</a></li>
              <li><a href="/browse" className="text-gray-300 hover:text-white transition-colors text-sm">View All Services</a></li>
            </ul>

            <h4 className="text-md font-semibold mb-2 text-white">Learn</h4>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">How It Works</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Success Stories</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">FAQ</a></li>
            </ul>
          </div>

          {/* For Users Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">For Providers</h3>
            <ul className="space-y-1.5 mb-4">
              <li><a href="/auth" className="text-gray-300 hover:text-white transition-colors text-sm">Create Account</a></li>
              <li><a href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm">Provider Dashboard</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Verification Process</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Payment Protection</a></li>
            </ul>

            <h4 className="text-md font-semibold mb-2 text-white">For Customers</h4>
            <ul className="space-y-1.5">
              <li><a href="/auth" className="text-gray-300 hover:text-white transition-colors text-sm">Account Login</a></li>
              <li><a href="/browse" className="text-gray-300 hover:text-white transition-colors text-sm">Browse Network</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Safety & Security</a></li>
            </ul>
          </div>

          {/* Contact & Stats Combined */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">Contact Us</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="h-3 w-3 text-blue-400" />
                <a href="mailto:support@findwhosabi.com" className="text-xs hover:text-white transition-colors">support@findwhosabi.com</a>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="h-3 w-3 text-yellow-400" />
                <a href="tel:+2341234567890" className="text-xs hover:text-white transition-colors">+234 123 456 7890</a>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="bg-gray-900 p-3 rounded-lg mb-4">
              <h4 className="text-sm font-semibold mb-2 text-white">Platform Stats</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <Users className="h-3 w-3 text-blue-400" />
                  <span>1000+ Providers</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <Award className="h-3 w-3 text-yellow-400" />
                  <span>5000+ Services</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span>4.8/5 Rating</span>
                </div>
              </div>
            </div>

            {/* Company Links */}
            <h4 className="text-md font-semibold mb-2 text-white">Company</h4>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Our Story</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Support Center</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap gap-4 mb-3 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Legal</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex space-x-3">
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">LinkedIn</a>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              © 2024 FindWhoSabi, Inc. • Connecting Nigeria with Skilled Professionals
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

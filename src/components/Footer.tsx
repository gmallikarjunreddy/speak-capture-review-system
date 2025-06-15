import { Mic } from 'lucide-react';
export const Footer = () => {
  return <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold">Voice Capture System</span>
        </div>
        <p className="text-gray-400 mb-8">
          Building the future of speech technology, one voice at a time.
        </p>
        <div className="flex justify-center items-center space-x-8 w-full">
          <img alt="ICFAI Foundation for Higher Education Logo" className="max-h-16 w-auto object-contain bg-white p-2 rounded-md" src="https://www.ifheindia.org/assets/img/Logo.svg" />
          <img src="/lovable-uploads/fd3b9f3a-e980-4235-8761-1a5d1c8de3d1.png" alt="aiTe Logo" className="max-h-16 w-auto object-contain bg-white p-2 rounded-md" />
        </div>
      </div>
    </footer>;
};
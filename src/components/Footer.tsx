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
        <div className="flex justify-center items-center space-x-4">
          <img src="/lovable-uploads/6fab767f-d57d-48e1-8938-bf7e64722a11.png" alt="ICFAI Foundation for Higher Education Logo" className="h-12 object-scale-down" />
          <img src="/lovable-uploads/ab5649a2-059c-4c00-bf78-609cd8b00ec2.png" alt="IcfaiTech Logo" className="h-12 object-contain bg-gray-800 p-1 rounded-bl-md " />
        </div>
      </div>
    </footer>;
};

interface HeaderProps {
  className?: string;
}

export const Header = ({ className = "" }: HeaderProps) => {
  return (
    <div className={`flex justify-center items-center space-x-4 ${className}`}>
      <img 
        src="/lovable-uploads/6fab767f-d57d-48e1-8938-bf7e64722a11.png" 
        alt="ICFAI Foundation for Higher Education Logo" 
        className="h-12 object-contain" 
      />
      <img 
        src="/lovable-uploads/ab5649a2-059c-4c00-bf78-609cd8b00ec2.png" 
        alt="IcfaiTech Logo" 
        className="h-12 object-contain bg-gray-100 p-1 rounded-md" 
      />
    </div>
  );
};

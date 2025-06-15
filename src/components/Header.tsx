interface HeaderProps {
  className?: string;
}
export const Header = ({
  className = ""
}: HeaderProps) => {
  return <div className={`flex justify-center items-center space-x-4 ${className}`}>
      <img alt="ICFAI Foundation for Higher Education Logo" className="h-12 object-contain" src="https://www.ifheindia.org/assets/img/Logo.svg" />
      <img alt="IcfaiTech Logo" className="h-12 object-contain bg-gray-100 p-1 rounded-md" src="https://www.ifheindia.org/IcfaiTechassets/img/IcfaiTech-logo.svg" />
    </div>;
};
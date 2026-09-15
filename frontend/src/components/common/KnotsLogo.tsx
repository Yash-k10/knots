interface KnotsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  animate?: boolean;
}


export default function KnotsLogo({
  className = '',
  size = 'md',
  animate = true,
}: KnotsLogoProps) {
  const sizeClasses = {
    sm: 'h-6 sm:h-7 w-auto',
    md: 'h-8 sm:h-9 w-auto',
    lg: 'h-10 sm:h-12 w-auto',
    xl: 'h-16 w-auto sm:h-20',
    hero: 'h-20 w-auto sm:h-24 md:h-28',
  };

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src="/knots_logo.png"
        alt="KNOTS Official Infinity Loop Design"
        className={`${sizeClasses[size]} object-contain ${
          animate ? 'hover:scale-105 transition-transform duration-300 transform' : ''
        }`}
      />
    </div>
  );
}

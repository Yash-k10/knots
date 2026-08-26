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
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto sm:h-28',
    hero: 'h-24 w-auto sm:h-32 md:h-36',
  };

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src="/knots_logo.png"
        alt="KNOTS Official Infinity Loop Design"
        className={`${sizeClasses[size]} object-contain drop-shadow-sm ${
          animate ? 'hover:scale-105 transition-transform duration-300 transform' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          filter: 'drop-shadow(0 4px 12px rgba(75, 99, 210, 0.15))',
        }}
      />
    </div>
  );
}

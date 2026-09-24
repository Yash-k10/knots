interface KnotsLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  animate?: boolean;
}


export default function KnotsLogo({
  className = '',
  size = 'md',
  animate = true,
}: KnotsLogoProps) {
  const sizeClasses = {
    xs: 'h-4 sm:h-5 w-auto max-w-full',
    sm: 'h-5 sm:h-6 md:h-7 w-auto max-w-full',
    md: 'h-5 sm:h-7 md:h-9 w-auto max-w-full',
    lg: 'h-6 sm:h-9 md:h-11 w-auto max-w-full',
    xl: 'h-10 sm:h-14 md:h-18 w-auto max-w-full',
    hero: 'h-12 sm:h-18 md:h-24 w-auto max-w-full',
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

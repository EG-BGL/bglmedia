interface ClubLogoProps {
  club: {
    logo_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    short_name?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-lg',
};

export default function ClubLogo({ club, size = 'md', className = '' }: ClubLogoProps) {
  const sizeClass = sizeMap[size];

  if (club.logo_url) {
    return (
      <img
        src={club.logo_url}
        alt={club.short_name ?? 'Club'}
        loading="lazy"
        className={`${sizeClass} object-contain ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-lg flex items-center justify-center font-black shrink-0 ${className}`}
      style={{
        backgroundColor: club.primary_color ?? '#1a365d',
        color: club.secondary_color ?? '#d69e2e',
      }}
    >
      {club.short_name?.slice(0, 2)}
    </div>
  );
}

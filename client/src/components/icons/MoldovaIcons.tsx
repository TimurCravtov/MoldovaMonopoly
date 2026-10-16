import React from 'react';
import {
  Plane,
  TrainFront,
  Zap,
  Flame,
  Landmark,
  Castle,
  Crown,
  Gift,
  Compass,
  ShieldAlert,
  Building2,
  Trees,
  Factory,
  RadioTower,
  Store,
  Wine,
  Music,
  Award,
  Receipt,
  Wrench,
  Mail,
  Bus,
  Sparkles,
  Scale,
  ArrowUpRight,
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Custom hand-crafted SVG illustrations for the 8 Moldovan player tokens.
 */
export const TokenSvg: React.FC<{ tokenId: string; className?: string }> = ({
  tokenId,
  className = 'w-4 h-4',
}) => {
  switch (tokenId) {
    case 'trolleybus':
      // Chișinău RTEC Trolleybus No. 22 with overhead collector poles
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 6L11 2M13 6L18 2" />
          <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
          <path d="M3 12h18M8 6v6M15 6v6" />
          <circle cx="7.5" cy="18.5" r="2" fill="currentColor" />
          <circle cx="16.5" cy="18.5" r="2" fill="currentColor" />
        </svg>
      );
    case 'placinta':
      // Traditional Moldovan Spiral Plăcintă Învârtită
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" />
          <path d="M12 12c0-2 1.5-3 3-3s3 1.5 3 3.5-2 4.5-5.5 4.5-6.5-3-6.5-6.5 3.5-6.5 7.5-6.5" />
        </svg>
      );
    case 'grapes':
      // Moldovan Grape Cluster
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 3v3m0 0c2-2 4-1 4 0M12 6c-2-2-4-1-4 0" />
          <circle cx="9" cy="10" r="2.2" fill="currentColor" fillOpacity="0.2" />
          <circle cx="15" cy="10" r="2.2" fill="currentColor" fillOpacity="0.2" />
          <circle cx="12" cy="10" r="2.2" fill="currentColor" fillOpacity="0.2" />
          <circle cx="10.5" cy="14" r="2.2" fill="currentColor" fillOpacity="0.2" />
          <circle cx="13.5" cy="14" r="2.2" fill="currentColor" fillOpacity="0.2" />
          <circle cx="12" cy="18" r="2.2" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );
    case 'wine':
      // Purcari / Cricova Wine Goblet
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M8 22h8M12 15v7" />
          <path d="M6 3h12l-1 7a5 5 0 0 1-10 0L6 3z" fill="currentColor" fillOpacity="0.18" />
          <path d="M6.8 8h10.4" />
        </svg>
      );
    case 'cusma':
      // Traditional Moldovan Astrakhan Fur Hat (Cușmă de Cârlan)
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M5 18h14l-1.5-11a3 3 0 0 0-3-2.5h-5A3 3 0 0 0 6.5 7L5 18z" fill="currentColor" fillOpacity="0.2" />
          <rect x="4" y="17" width="16" height="3" rx="1" />
        </svg>
      );
    case 'rutiera':
      // Chișinău Marshrutka (Maxi-Taxi 101)
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M3 16V8a2 2 0 0 1 2-2h11l4 4v6H3z" fill="currentColor" fillOpacity="0.15" />
          <path d="M14 6v4h5M8 6v4" />
          <circle cx="7" cy="16.5" r="2" fill="currentColor" />
          <circle cx="16.5" cy="16.5" r="2" fill="currentColor" />
        </svg>
      );
    case 'sunflower':
      // Bălți / Moldova Sunflower
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
        </svg>
      );
    case 'violin':
    default:
      // Lăutar Violin / Cobza
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18 3l3 3-9.5 9.5M14 6l4 4" />
          <path d="M9 11a4.5 4.5 0 1 0 4 4L9 11z" fill="currentColor" fillOpacity="0.2" />
          <path d="M3 21l3-3" />
        </svg>
      );
  }
};

export const HouseSvg: React.FC<IconProps> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor">
    <path d="M8 1.5L1.5 7h2v7h9V7h2L8 1.5zm1.5 10.5h-3V8.5h3V12z" />
  </svg>
);

export const HotelSvg: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 20 20" className={className} fill="currentColor">
    <path d="M10 1L2 6.5V18h16V6.5L10 1zm-3 14H5v-2.5h2V15zm0-4.5H5V8h2v2.5zm4 4.5H9v-3h2v3zm0-5H9V8h2v2zm4 5h-2v-2.5h2V15zm0-4.5h-2V8h2v2.5z" />
  </svg>
);

/**
 * Custom architectural & thematic vector icon renderer for all 40 Chișinău tiles.
 */
export const TileIcon: React.FC<{ iconKey: string; className?: string }> = ({
  iconKey,
  className = 'w-4 h-4',
}) => {
  switch (iconKey) {
    case 'go':
      return <ArrowUpRight className={className} />;
    case 'industrial':
      return <Wrench className={className} />;
    case 'chest':
      return <Gift className={className} />;
    case 'post':
      return <Mail className={className} />;
    case 'tax':
      return <Receipt className={className} />;
    case 'trolleybus':
      return <TokenSvg tokenId="trolleybus" className={className} />;
    case 'rutiera':
      return <Bus className={className} />;
    case 'train':
      return <TrainFront className={className} />;
    case 'airport':
      return <Plane className={className} />;
    case 'electric':
      return <Zap className={className} />;
    case 'gas':
      return <Flame className={className} />;
    case 'chance':
      return <Compass className={className} />;
    case 'jail':
      return <Scale className={className} />;
    case 'siren':
      return <ShieldAlert className={className} />;
    case 'arch':
      // Custom SVG for Chișinău's Arcul de Triumf
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
          <path d="M3 21h18M4 21V8h16v13M3 8h18M6 5h12v3H6z" />
          <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
          <circle cx="12" cy="11" r="1" fill="currentColor" />
        </svg>
      );
    case 'gates':
      // Custom SVG for Porțile Orașului stepped twin high-rises
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
          <path d="M2 21V5h4v4h2v4h2v8H2zM22 21V5h-4v4h-2v4h-2v8h8z" />
        </svg>
      );
    case 'park':
    case 'garden':
    case 'avenue':
      return <Trees className={className} />;
    case 'market':
    case 'mall':
      return <Store className={className} />;
    case 'factory':
      return <Factory className={className} />;
    case 'tower':
      return <RadioTower className={className} />;
    case 'monastery':
    case 'mansion':
      return <Landmark className={className} />;
    case 'fortress':
      return <Castle className={className} />;
    case 'winery':
    case 'cellar':
      return <Wine className={className} />;
    case 'collection':
      return <Award className={className} />;
    case 'piano':
    case 'wedding':
      return <Music className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'circus':
      return <Sparkles className={className} />;
    default:
      return <Building2 className={className} />;
  }
};

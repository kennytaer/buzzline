interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface BaseIconProps extends IconProps {
  children: React.ReactNode;
}

// Base icon component for common SVG patterns
const BaseIcon = ({ className = '', size = 'md', children }: BaseIconProps) => (
  <svg 
    className={`${sizeMap[size]} ${className}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

export const Icons = {
  // Navigation & UI
  Home: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </BaseIcon>
  ),

  Campaign: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
      <path d="M9 12l2 2 4-4" />
    </BaseIcon>
  ),

  // People icons - using shared People component
  Contacts: ({ className, size }: IconProps) => (
    <Icons.People className={className} size={size} />
  ),

  Team: ({ className, size }: IconProps) => (
    <Icons.People className={className} size={size} />
  ),

  Analytics: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </BaseIcon>
  ),

  // Base People icon (consolidated from Contacts and Team)
  People: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </BaseIcon>
  ),

  // Actions
  Plus: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </BaseIcon>
  ),

  Edit: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </BaseIcon>
  ),

  Trash: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </BaseIcon>
  ),

  Send: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9 22,2" />
    </BaseIcon>
  ),

  Upload: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,5 17,10" />
      <line x1="12" y1="5" x2="12" y2="15" />
    </BaseIcon>
  ),

  Download: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </BaseIcon>
  ),

  // Communication
  Mail: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </BaseIcon>
  ),

  Phone: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </BaseIcon>
  ),

  // Status indicators
  Check: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <polyline points="20,6 9,17 4,12" />
    </BaseIcon>
  ),

  X: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </BaseIcon>
  ),

  Warning: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </BaseIcon>
  ),

  Info: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </BaseIcon>
  ),

  // Navigation
  ChevronLeft: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <polyline points="15,18 9,12 15,6" />
    </BaseIcon>
  ),

  ChevronRight: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <polyline points="9,18 15,12 9,6" />
    </BaseIcon>
  ),

  Menu: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </BaseIcon>
  ),

  Settings: ({ className, size }: IconProps) => (
    <BaseIcon className={className} size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </BaseIcon>
  ),
};
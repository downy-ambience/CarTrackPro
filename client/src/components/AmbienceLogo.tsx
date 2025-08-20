import logoUrl from "@assets/ambience_horizontal_dual_1755664364781.png";

interface AmbienceLogoProps {
  className?: string;
}

export default function AmbienceLogo({ className = "w-8 h-8" }: AmbienceLogoProps) {
  return (
    <img 
      src={logoUrl} 
      alt="Ambience Logo" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
interface AmbienceLogoProps {
  className?: string;
}

export default function AmbienceLogo({ className = "w-8 h-8" }: AmbienceLogoProps) {
  // 임시로 심플한 SVG 로고를 제공합니다
  // 실제 앰비언스 로고 파일이 있으면 교체 가능합니다
  return (
    <svg 
      className={className} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 외곽 원 */}
      <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#1E40AF" strokeWidth="2"/>
      
      {/* 중앙 A 문자 */}
      <path 
        d="M12 28 L20 12 L28 28 M15 23 L25 23" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* 하단 점 */}
      <circle cx="20" cy="32" r="2" fill="#3B82F6"/>
    </svg>
  );
}
export function SkylineSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
      <path
        d="M0 220V150L40 150V110H70V150H100V90H130V150H170V60H210V150H250V100H260V70H300V100H320V150H360V40H380V20H400V40H420V150H460V80H500V150H540V110H560V60H600V110H620V150H660V70H700V30H720V70H740V150H780V90H820V150H860V50H880V20H900V50H920V150H960V100H1000V60H1020V100H1060V150H1100V70H1140V150H1200V220H0Z"
        fill="url(#skyline-gradient)"
        fillOpacity="0.5"
      />
      <defs>
        <linearGradient id="skyline-gradient" x1="0" y1="0" x2="0" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3a323e" />
          <stop offset="1" stopColor="#0a0a0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

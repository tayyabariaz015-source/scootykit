export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 420" className={className} role="img" aria-label="Illustration of an electric scooty">
<defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stopColor="#F43F5E" stopOpacity="0.35"/>
      <stop offset="1" stopColor="#F43F5E" stopOpacity="0"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFFFFF"/>
      <stop offset="1" stopColor="#CBD5E1"/>
    </linearGradient>
    <linearGradient id="apron" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFFFFF"/>
      <stop offset="1" stopColor="#D5DCE6"/>
    </linearGradient>
  </defs>
  <circle cx="320" cy="250" r="210" fill="url(#glow)"/>
  <g strokeLinecap="round" opacity="0.5">
    <path d="M18 250 H88" stroke="#F43F5E" strokeWidth="4"/>
    <path d="M36 280 H78" stroke="#FFFFFF" strokeWidth="3" opacity="0.5"/>
    <path d="M6 310 H70" stroke="#FFFFFF" strokeWidth="3" opacity="0.35"/>
  </g>
  <ellipse cx="312" cy="376" rx="236" ry="11" fill="#000" opacity="0.35"/>
  
  <g>
    <circle cx="160" cy="324" r="49" fill="#0B111E" stroke="#334155" strokeWidth="2"/>
    <circle cx="160" cy="324" r="31" fill="#334155"/>
    <circle cx="160" cy="324" r="23" fill="#1F2937"/>
    <g stroke="#64748B" strokeWidth="3" strokeLinecap="round">
      <path d="M160 324 L160 303"/><path d="M160 324 L180 330"/><path d="M160 324 L148 341"/><path d="M160 324 L140 330"/><path d="M160 324 L172 341"/>
    </g>
    <circle cx="160" cy="324" r="8" fill="#F43F5E"/>
  </g>
  
  <g>
    <circle cx="466" cy="324" r="49" fill="#0B111E" stroke="#334155" strokeWidth="2"/>
    <circle cx="466" cy="324" r="31" fill="#334155"/>
    <circle cx="466" cy="324" r="23" fill="#1F2937"/>
    <g stroke="#64748B" strokeWidth="3" strokeLinecap="round">
      <path d="M466 324 L466 303"/><path d="M466 324 L486 330"/><path d="M466 324 L454 341"/><path d="M466 324 L446 330"/><path d="M466 324 L478 341"/>
    </g>
    <circle cx="466" cy="324" r="13" fill="none" stroke="#94A3B8" strokeWidth="3"/>
    <circle cx="466" cy="324" r="7" fill="#F43F5E"/>
  </g>
  
  <path d="M446 166 L466 324" stroke="#94A3B8" strokeWidth="8" strokeLinecap="round"/>
  
  <path d="M280 300 L404 300 C414 300 418 308 414 316 L408 328 C405 334 399 336 392 336 L296 336 C287 336 282 330 282 322 Z" fill="#1F2937"/>
  <path d="M292 300 L406 300" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
  
  <path d="M74 292 C70 254 102 226 158 224 L266 224 C294 224 308 244 308 270 L308 300 C308 309 302 314 293 314 L90 314 C80 314 74 306 74 292 Z" fill="url(#body)"/>
  <path d="M96 282 C150 272 236 270 304 276" stroke="#F43F5E" strokeWidth="5" strokeLinecap="round" fill="none"/>
  <path d="M206 244 L194 262 L204 262 L198 278 L214 256 L204 256 L210 244 Z" fill="#F43F5E"/>
  <rect x="70" y="252" width="12" height="20" rx="4" fill="#F43F5E"/>
  
  <path d="M116 226 C116 210 132 200 154 200 L254 200 C274 200 284 212 280 226 Z" fill="#0B111E"/>
  <path d="M132 206 L262 206" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
  
  <path d="M96 232 C92 214 104 204 118 206" stroke="#94A3B8" strokeWidth="5" fill="none" strokeLinecap="round"/>
  
  <path d="M372 322 C388 262 404 214 426 170 L452 160 C458 204 452 254 436 302 C431 316 420 324 404 324 Z" fill="url(#apron)"/>
  
  <path d="M420 304 C426 280 446 266 468 266 C494 266 512 282 516 300 L502 302 C497 288 484 279 468 279 C451 279 438 290 434 306 Z" fill="#E2E8F0"/>
  
  <path d="M398 104 L488 98" stroke="#0B111E" strokeWidth="8" strokeLinecap="round"/>
  <path d="M396 104 L412 103" stroke="#F43F5E" strokeWidth="10" strokeLinecap="round"/>
  <path d="M424 92 L410 62" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>
  <ellipse cx="406" cy="56" rx="12" ry="7.5" fill="#334155" stroke="#94A3B8" strokeWidth="2"/>
  <path d="M420 98 C420 86 430 80 444 80 L468 82 C480 83 485 92 482 104 L476 142 C473 158 462 168 448 168 L440 168 C428 168 422 158 424 146 Z" fill="url(#apron)"/>
  <ellipse cx="465" cy="126" rx="9" ry="13" fill="#FFF7ED"/>
  <ellipse cx="466" cy="126" rx="4" ry="7" fill="#FFFFFF"/>
  <path d="M476 118 L566 98 L566 156 L476 136 Z" fill="#FFF7ED" opacity="0.08"/>
  <path d="M432 92 L470 94" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

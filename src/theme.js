export const theme = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  surfaceWarm: "#FFF8F3",
  border: "#F0EBE3",
  accent: "#E8824A",
  accentLight: "#F5C4A0",
  accentMuted: "#FDE8D8",
  text: "#1A1612",
  textMuted: "#7A6E65",
  textLight: "#B0A89E",
  success: "#6BAF8E",
  warning: "#E8A84A",
  danger: "#E06B6B",
};

export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #FAFAF8;
    color: #1A1612;
    -webkit-font-smoothing: antialiased;
  }

  .serif { font-family: 'DM Serif Display', serif; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #F5C4A0; border-radius: 4px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes expandLine {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  .anim-logo    { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.05s forwards; }
  .anim-tagline { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.35s forwards; }
  .anim-divider { transform-origin: left; transform: scaleX(0); animation: expandLine 0.5s cubic-bezier(0.22,1,0.36,1) 0.7s forwards; }
  .anim-cards   { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.9s forwards; }
  .anim-footer  { opacity: 0; animation: fadeIn 0.5s ease 1.3s forwards; }
`;
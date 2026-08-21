import React from "react";

/**
 * Exact KingPC Logo vector matching kingpccolonia.com:
 * - Dynamic slanted "KING" in signature Golden Yellow (#f6c90e / #ffd000)
 * - CPU Processor Chip with circuits/pins and glowing reflection
 * - Stylized "PC" in metallic white with dark/blue border overlapping the CPU chip
 */
export const KING_PC_LOGO_DARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 105" width="200" height="64" style="display:block; margin: 0 auto; max-width: 100%; height: auto; overflow: visible;">
  <defs>
    <!-- Metallic Blue-Black gradient for the CPU chip -->
    <linearGradient id="chipGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14214d" />
      <stop offset="45%" stop-color="#0a1233" />
      <stop offset="80%" stop-color="#050a1f" />
      <stop offset="100%" stop-color="#121e4a" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff59d" />
      <stop offset="30%" stop-color="#ffd600" />
      <stop offset="85%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="chipGlossDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.7" />
      <stop offset="40%" stop-color="#38bdf8" stop-opacity="0.2" />
      <stop offset="70%" stop-color="#000000" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="glareFlareDark" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- CPU Chip Pins / Circuits with Cyan Glow -->
  <g transform="translate(198, 8)">
    <!-- Top Pins -->
    <g stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" opacity="0.85">
      <line x1="8" y1="2" x2="8" y2="10" />
      <line x1="14" y1="-2" x2="14" y2="10" />
      <line x1="20" y1="-5" x2="20" y2="10" />
      <line x1="26" y1="-3" x2="26" y2="10" />
      <line x1="32" y1="-6" x2="32" y2="10" />
      <line x1="38" y1="-2" x2="38" y2="10" />
      <line x1="44" y1="-5" x2="44" y2="10" />
      <line x1="50" y1="-1" x2="50" y2="10" />
      <line x1="56" y1="-4" x2="56" y2="10" />
      <line x1="62" y1="2" x2="62" y2="10" />
      <line x1="68" y1="-2" x2="68" y2="10" />
      <line x1="74" y1="1" x2="74" y2="10" />
      <line x1="80" y1="3" x2="80" y2="10" />
    </g>

    <!-- Bottom Pins -->
    <g stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" opacity="0.85">
      <line x1="8" y1="76" x2="8" y2="85" />
      <line x1="14" y1="76" x2="14" y2="89" />
      <line x1="20" y1="76" x2="20" y2="92" />
      <line x1="26" y1="76" x2="26" y2="90" />
      <line x1="32" y1="76" x2="32" y2="93" />
      <line x1="38" y1="76" x2="38" y2="89" />
      <line x1="44" y1="76" x2="44" y2="92" />
      <line x1="50" y1="76" x2="50" y2="88" />
      <line x1="56" y1="76" x2="56" y2="91" />
      <line x1="62" y1="76" x2="62" y2="85" />
      <line x1="68" y1="76" x2="68" y2="88" />
      <line x1="74" y1="76" x2="74" y2="84" />
      <line x1="80" y1="76" x2="80" y2="86" />
    </g>

    <!-- Right Pins -->
    <g stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" opacity="0.85">
      <line x1="82" y1="16" x2="91" y2="16" />
      <line x1="82" y1="22" x2="95" y2="22" />
      <line x1="82" y1="28" x2="92" y2="28" />
      <line x1="82" y1="34" x2="97" y2="34" />
      <line x1="82" y1="40" x2="93" y2="40" />
      <line x1="82" y1="46" x2="96" y2="46" />
      <line x1="82" y1="52" x2="91" y2="52" />
      <line x1="82" y1="58" x2="95" y2="58" />
      <line x1="82" y1="64" x2="90" y2="64" />
      <line x1="82" y1="70" x2="94" y2="70" />
    </g>

    <!-- Left Pins -->
    <g stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" opacity="0.85">
      <line x1="0" y1="16" x2="8" y2="16" />
      <line x1="-5" y1="22" x2="8" y2="22" />
      <line x1="-2" y1="28" x2="8" y2="28" />
      <line x1="-6" y1="34" x2="8" y2="34" />
      <line x1="-3" y1="40" x2="8" y2="40" />
      <line x1="-7" y1="46" x2="8" y2="46" />
      <line x1="-2" y1="52" x2="8" y2="52" />
      <line x1="-5" y1="58" x2="8" y2="58" />
      <line x1="0" y1="64" x2="8" y2="64" />
      <line x1="-4" y1="70" x2="8" y2="70" />
    </g>

    <!-- Main Outer Chip Body -->
    <rect x="8" y="9" width="74" height="68" rx="12" fill="url(#chipGradDark)" stroke="#38bdf8" stroke-width="2" />
    
    <!-- Inner Glossy Bevel -->
    <rect x="13" y="14" width="64" height="58" rx="8" fill="none" stroke="#60a5fa" stroke-width="1.2" opacity="0.6" />
    
    <!-- Glass Highlight Reflection -->
    <path d="M13,14 Q48,44 77,28 L77,14 Z" fill="url(#chipGlossDark)" />
    
    <!-- Lens Flare / Spark Line across chip -->
    <ellipse cx="45" cy="50" rx="32" ry="1.8" fill="url(#glareFlareDark)" />
  </g>

  <!-- Word "KING" in ALL-CAPS - Vibrant Golden Yellow with subtle dark drop outline and speed skew -->
  <g transform="translate(0, 0)">
    <text x="10" y="74" font-family="'Arial Black', 'Impact', 'Segoe UI Black', sans-serif" font-size="54" font-weight="900" font-style="italic" fill="#000000" stroke="#000000" stroke-width="4" letter-spacing="3.2px" transform="skewX(-13)">KING</text>
    <text x="10" y="74" font-family="'Arial Black', 'Impact', 'Segoe UI Black', sans-serif" font-size="54" font-weight="900" font-style="italic" fill="url(#goldGrad)" letter-spacing="3.2px" transform="skewX(-13)">KING</text>
  </g>

  <!-- Word "PC" in ALL-CAPS - Bold Italic White with Blue-Black Outline, positioned over the CPU -->
  <g transform="translate(0, 0)">
    <text x="200" y="74" font-family="'Arial Black', 'Impact', 'Segoe UI Black', sans-serif" font-size="54" font-weight="900" font-style="italic" fill="#ffffff" stroke="#050a24" stroke-width="7.5" stroke-linejoin="round" paint-order="stroke fill" letter-spacing="2.5px" transform="skewX(-13)">PC</text>
  </g>
</svg>
`.trim();

export const KING_PC_LOGO_MONOCHROME_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 105" width="200" height="64" style="display:block; margin: 0 auto 4px auto; max-width: 100%; height: auto; overflow: visible;">
  <!-- Pure 1-Bit Solid High-Contrast Monochrome Vector for POS Thermal Printers (No Gradients, No Halftones) -->
  <g transform="translate(198, 8)">
    <!-- Top Pins (Solid 100% Black) -->
    <g stroke="#000000" stroke-width="2" stroke-linecap="square">
      <line x1="8" y1="2" x2="8" y2="10" />
      <line x1="14" y1="-2" x2="14" y2="10" />
      <line x1="20" y1="-5" x2="20" y2="10" />
      <line x1="26" y1="-3" x2="26" y2="10" />
      <line x1="32" y1="-6" x2="32" y2="10" />
      <line x1="38" y1="-2" x2="38" y2="10" />
      <line x1="44" y1="-5" x2="44" y2="10" />
      <line x1="50" y1="-1" x2="50" y2="10" />
      <line x1="56" y1="-4" x2="56" y2="10" />
      <line x1="62" y1="2" x2="62" y2="10" />
      <line x1="68" y1="-2" x2="68" y2="10" />
      <line x1="74" y1="1" x2="74" y2="10" />
      <line x1="80" y1="3" x2="80" y2="10" />
    </g>

    <!-- Bottom Pins (Solid 100% Black) -->
    <g stroke="#000000" stroke-width="2" stroke-linecap="square">
      <line x1="8" y1="76" x2="8" y2="85" />
      <line x1="14" y1="76" x2="14" y2="89" />
      <line x1="20" y1="76" x2="20" y2="92" />
      <line x1="26" y1="76" x2="26" y2="90" />
      <line x1="32" y1="76" x2="32" y2="93" />
      <line x1="38" y1="76" x2="38" y2="89" />
      <line x1="44" y1="76" x2="44" y2="92" />
      <line x1="50" y1="76" x2="50" y2="88" />
      <line x1="56" y1="76" x2="56" y2="91" />
      <line x1="62" y1="76" x2="62" y2="85" />
      <line x1="68" y1="76" x2="68" y2="88" />
      <line x1="74" y1="76" x2="74" y2="84" />
      <line x1="80" y1="76" x2="80" y2="86" />
    </g>

    <!-- Right Pins -->
    <g stroke="#000000" stroke-width="2" stroke-linecap="square">
      <line x1="82" y1="16" x2="91" y2="16" />
      <line x1="82" y1="22" x2="95" y2="22" />
      <line x1="82" y1="28" x2="92" y2="28" />
      <line x1="82" y1="34" x2="97" y2="34" />
      <line x1="82" y1="40" x2="93" y2="40" />
      <line x1="82" y1="46" x2="96" y2="46" />
      <line x1="82" y1="52" x2="91" y2="52" />
      <line x1="82" y1="58" x2="95" y2="58" />
      <line x1="82" y1="64" x2="90" y2="64" />
      <line x1="82" y1="70" x2="94" y2="70" />
    </g>

    <!-- Left Pins -->
    <g stroke="#000000" stroke-width="2" stroke-linecap="square">
      <line x1="0" y1="16" x2="8" y2="16" />
      <line x1="-5" y1="22" x2="8" y2="22" />
      <line x1="-2" y1="28" x2="8" y2="28" />
      <line x1="-6" y1="34" x2="8" y2="34" />
      <line x1="-3" y1="40" x2="8" y2="40" />
      <line x1="-7" y1="46" x2="8" y2="46" />
      <line x1="-2" y1="52" x2="8" y2="52" />
      <line x1="-5" y1="58" x2="8" y2="58" />
      <line x1="0" y1="64" x2="8" y2="64" />
      <line x1="-4" y1="70" x2="8" y2="70" />
    </g>

    <!-- Solid Black CPU Chip Body -->
    <rect x="8" y="9" width="74" height="68" rx="8" fill="#000000" stroke="#000000" stroke-width="2" />
    <!-- Pure White Inner Bevel for Sharp Thermal Contrast -->
    <rect x="13" y="14" width="64" height="58" rx="6" fill="none" stroke="#ffffff" stroke-width="2" />
  </g>

  <!-- Word "KING" in Solid 100% Black -->
  <g transform="translate(0, 0)">
    <text x="10" y="74" font-family="'Arial Black', 'Impact', 'Segoe UI Black', sans-serif" font-size="54" font-weight="900" font-style="italic" fill="#000000" letter-spacing="3.2px" transform="skewX(-13)">KING</text>
  </g>

  <!-- Word "PC" in Solid White with Solid 100% Black Border -->
  <g transform="translate(0, 0)">
    <text x="200" y="74" font-family="'Arial Black', 'Impact', 'Segoe UI Black', sans-serif" font-size="54" font-weight="900" font-style="italic" fill="#ffffff" stroke="#000000" stroke-width="8" stroke-linejoin="round" paint-order="stroke fill" letter-spacing="2.5px" transform="skewX(-13)">PC</text>
  </g>
</svg>
`.trim();

export const KING_PC_LOGO_SVG = KING_PC_LOGO_MONOCHROME_SVG;

export const KingPcLogo: React.FC<{
  className?: string;
  width?: number;
  height?: number;
  theme?: "dark" | "light" | "monochrome";
}> = ({
  className = "mx-auto",
  width = 180,
  height = 58,
  theme = "dark",
}) => {
  const getSvg = () => {
    if (theme === "dark") return KING_PC_LOGO_DARK_SVG;
    if (theme === "monochrome") return KING_PC_LOGO_MONOCHROME_SVG;
    return KING_PC_LOGO_SVG;
  };

  return (
    <div
      className={className}
      style={{ width, height }}
      dangerouslySetInnerHTML={{
        __html: getSvg(),
      }}
    />
  );
};

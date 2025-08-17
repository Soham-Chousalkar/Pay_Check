import { useMemo, memo } from "react";

/**
 * RetroDigitalNumber - Displays numbers in a retro 7-segment digital style
 * @param {string|number} value - The value to display
 * @param {string} className - Additional CSS classes
 * @param {boolean} showDollarSign - Whether to show a dollar sign
 */
export const RetroDigitalNumber = memo(({ value, className = "", showDollarSign = false }) => {
  const digits = useMemo(() => String(value).split(''), [value]);

  return (
    <div className={`retro-digital ${className}`}>
      {showDollarSign && (
        <img
          src="/Dollar-sign.png"
          alt="$"
          className="inline-block w-4 h-4 mr-1 align-middle"
          style={{ objectFit: 'contain', maxWidth: '16px', maxHeight: '16px' }}
        />
      )}
      {digits.map((char, index) => {
        if (char === '.') {
          return (
            <span key={`${char}-${index}`} className="retro-digit" data-char=".">
              <span className="segment segment-char"></span>
              <span style={{ visibility: 'hidden' }}>{char}</span>
            </span>
          );
        }

        if (/[0-9]/.test(char)) {
          return (
            <span key={`${char}-${index}`} className="retro-digit" data-digit={char}>
              <span className="segment segment-a"></span>
              <span className="segment segment-b"></span>
              <span className="segment segment-c"></span>
              <span className="segment segment-d"></span>
              <span className="segment segment-e"></span>
              <span className="segment segment-f"></span>
              <span className="segment segment-g"></span>
              <span style={{ visibility: 'hidden' }}>{char}</span>
            </span>
          );
        }

        return (
          <span key={`${char}-${index}`} className="retro-digit" data-char={char}>
            <span className="segment segment-char"></span>
            <span style={{ visibility: 'hidden' }}>{char}</span>
          </span>
        );
      })}
    </div>
  );
});

/**
 * RetroDigitalText - Displays text in a retro digital style
 * @param {string} text - The text to display
 * @param {string} className - Additional CSS classes
 */
export const RetroDigitalText = memo(({ text, className = "" }) => {
  const characters = useMemo(() => text.split(''), [text]);

  return (
    <div className={`retro-digital ${className}`}>
      {characters.map((char, index) => {
        if (/[0-9]/.test(char)) {
          return (
            <span key={`${char}-${index}`} className="retro-digit" data-digit={char}>
              <span className="segment segment-a"></span>
              <span className="segment segment-b"></span>
              <span className="segment segment-c"></span>
              <span className="segment segment-d"></span>
              <span className="segment segment-e"></span>
              <span className="segment segment-f"></span>
              <span className="segment segment-g"></span>
              <span style={{ visibility: 'hidden' }}>{char}</span>
            </span>
          );
        }

        return (
          <span key={`${char}-${index}`} className="retro-digit" data-char={char}>
            <span className="segment segment-char"></span>
            <span style={{ visibility: 'hidden' }}>{char}</span>
          </span>
        );
      })}
    </div>
  );
});

// Add component display names for better debugging
RetroDigitalNumber.displayName = 'RetroDigitalNumber';
RetroDigitalText.displayName = 'RetroDigitalText';

const CJK_RANGES = [
  [0x4e00, 0x9fff],
  [0x3400, 0x4dbf],
  [0xf900, 0xfaff],
  [0x2f800, 0x2fa1f],
];

function isCJK(code) {
  return CJK_RANGES.some(([lo, hi]) => code >= lo && code <= hi);
}

function isLetter(code) {
  return (
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a) ||
    (code >= 0xc0 && code <= 0x24f)
  );
}

function isDigit(code) {
  return code >= 0x30 && code <= 0x39;
}

function classify(char) {
  const code = char.codePointAt(0);
  if (isCJK(code)) return 'cjk';
  if (isLetter(code)) return 'latin';
  if (isDigit(code)) return 'digit';
  return 'other';
}

function segmentText(str) {
  if (!str) return [];
  const segments = [];
  let i = 0;
  while (i < str.length) {
    const type = classify(str[i]);
    let end = i + 1;
    while (end < str.length && classify(str[end]) === type) end++;
    segments.push({ text: str.slice(i, end), type, start: i });
    i = end;
  }
  return segments;
}

function processLatin(word, ratio) {
  if (word.length <= 1) return [{ text: word, bold: true }];
  const split = Math.min(Math.max(1, Math.ceil(word.length * ratio)), word.length - 1);
  return [
    { text: word.slice(0, split), bold: true },
    { text: word.slice(split), bold: false },
  ];
}

function processCJK(text) {
  if (text.length <= 1) return [{ text, bold: false }];
  const segments = [];
  for (let i = 0; i < text.length; i++) {
    segments.push({ text: text[i], bold: i % 2 === 0 });
  }
  return segments;
}

function processDigits(text, ratio) {
  if (text.length <= 2) return [{ text, bold: true }];
  const split = Math.min(Math.max(1, Math.ceil(text.length * ratio)), text.length - 1);
  return [
    { text: text.slice(0, split), bold: true },
    { text: text.slice(split), bold: false },
  ];
}

export function calculateBoldBoundary(text, ratio = 0.45) {
  if (!text || text.trim().length === 0) return [{ text: text || '', bold: false }];

  const segments = segmentText(text);
  const result = [];

  for (const seg of segments) {
    switch (seg.type) {
      case 'latin':
        result.push(...processLatin(seg.text, ratio));
        break;
      case 'cjk':
        result.push(...processCJK(seg.text));
        break;
      case 'digit':
        result.push(...processDigits(seg.text, ratio));
        break;
      default:
        result.push({ text: seg.text, bold: false });
    }
  }
  return result;
}

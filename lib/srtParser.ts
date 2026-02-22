export interface LyricLine {
  start: number;
  end: number;
  text: string;
}

export function parseSRT(data: string): LyricLine[] {
  const lyrics: LyricLine[] = [];
  
  // Normalize line endings and split by double newline
  const blocks = data.replace(/\r\n/g, '\n').split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length >= 2) {
      // Find the line that contains the arrow -->
      const timeLineIndex = lines.findIndex(l => l.includes('-->'));
      if (timeLineIndex !== -1) {
        const timeLine = lines[timeLineIndex];
        const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3}) --> (\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
        
        if (timeMatch) {
          const start = timeToSeconds(timeMatch[1]);
          const end = timeToSeconds(timeMatch[2]);
          const text = lines.slice(timeLineIndex + 1).join('\n');
          
          if (text) {
            lyrics.push({ start, end, text });
          }
        }
      }
    }
  }
  return lyrics;
}

function timeToSeconds(timeStr: string): number {
  const [hh, mm, ss_ms] = timeStr.split(':');
  // Handle both comma and dot for milliseconds
  const [ss, ms] = ss_ms.replace('.', ',').split(',');
  return (
    parseInt(hh, 10) * 3600 +
    parseInt(mm, 10) * 60 +
    parseInt(ss, 10) +
    parseInt(ms, 10) / 1000
  );
}

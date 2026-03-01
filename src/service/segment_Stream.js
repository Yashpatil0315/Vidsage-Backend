// segment_stream.js
// Usage: node segment_stream.js <VIDEO_URL> <OUT_DIR> [segmentSeconds] [jobId]
// Example: node segment_stream.js "https://youtu.be/xxxx" ./out 30 job_12345

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { processJob } = require('./transcribeAndSave');


console.log(' SEGMENT_STREAM VERSION: 2025-01-07 12:40 ');
async function streamAndSegment(url, outDir, segmentSeconds = 90) {
  if (!url) throw new Error('Missing url');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tmpAudio = path.join(outDir, 'input_audio.webm');
  const outPattern = path.join(outDir, 'segment_%03d.wav');

  console.log('Downloading audio with yt-dlp...');
  await new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '-f', 'bestaudio',
      '-o', tmpAudio,
      '--no-overwrites',
      url
    ]);

    let stderrData = '';
    ytdlp.stdout.on('data', d => console.log('[yt-dlp]', d.toString().trim()));
    ytdlp.stderr.on('data', d => {
      stderrData += d.toString();
      console.error('[yt-dlp stderr]', d.toString().trim());
    });

    ytdlp.on('error', reject);
    ytdlp.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with ${code}: ${stderrData.trim()}`));
    });
  });

  console.log('Segmenting audio with ffmpeg...');
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'error',
      '-i', tmpAudio,
      '-vn',
      '-ac', '1',
      '-ar', '16000',
      '-c:a', 'pcm_s16le',
      '-f', 'segment',
      '-segment_time', String(segmentSeconds),
      '-reset_timestamps', '1',
      outPattern
    ]);

    ffmpeg.on('error', reject);
    ffmpeg.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}`));
    });
  });

  fs.unlinkSync(tmpAudio);

  const files = fs.readdirSync(outDir)
    .filter(f => f.endsWith('.wav'))
    .sort((a,b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(f => path.join(outDir, f));

  if (!files.length) throw new Error('No segments produced');

  console.log(`Produced ${files.length} segments in ${outDir}`);
  return files;
}


// export for programmatic use
module.exports = { streamAndSegment };

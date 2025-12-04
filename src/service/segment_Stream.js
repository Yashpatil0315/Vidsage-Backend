// segment_stream.js
// Usage: node segment_stream.js <VIDEO_URL> <OUT_DIR> [segmentSeconds]
// Example: node segment_stream.js "https://youtu.be/xxxx" ./out 30

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function streamAndSegment(url, outDir, segmentSeconds = 30) {
  if (!url) throw new Error('Missing url');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPattern = path.join(outDir, 'segment_%03d.wav');

  // yt-dlp: write best audio to stdout
  const ytdlpArgs = ['-f', 'bestaudio', '-o', '-', url];

  // ffmpeg: read stdin, convert to mono 16k WAV (pcm_s16le), segment into equal lengths
  const ffmpegArgs = [
    '-hide_banner', '-loglevel', 'info',
    '-i', 'pipe:0',
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-c:a', 'pcm_s16le',
    '-f', 'segment',
    '-segment_time', String(segmentSeconds),
    '-reset_timestamps', '1',
    '-map', '0:a',
    outPattern
  ];

  console.log('Starting yt-dlp -> ffmpeg pipeline');
  const ytdlp = spawn('yt-dlp', ytdlpArgs, { stdio: ['ignore', 'pipe', 'inherit'] });
  const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  // pipe audio
  ytdlp.stdout.pipe(ffmpeg.stdin);

  // wait for ffmpeg finish
  await new Promise((resolve, reject) => {
    let ffErr;
    ffmpeg.on('error', (e) => ffErr = e);
    ytdlp.on('error', e => reject(e));

    ffmpeg.on('close', (code) => {
      if (ffErr) return reject(ffErr);
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exited with code ${code}`));
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        // yt-dlp may exit non-zero while ffmpeg continues if it already streamed; just warn
        console.warn(`yt-dlp exited with code ${code}`);
      }
    });
  });

  // collect produced segment file names
  const files = fs.readdirSync(outDir)
    .filter(f => f.endsWith('.wav'))
    .sort();

  if (files.length === 0) throw new Error('No segments produced');

  console.log(`Produced ${files.length} segments in ${outDir}`);
  return files.map(f => path.join(outDir, f));
}

// CLI
if (require.main === module) {
  (async () => {
    try {
      const [,, url, outDir = './out', seg = '30'] = process.argv;
      if (!url) {
        console.error('Usage: node segment_stream.js <VIDEO_URL> <OUT_DIR> [segmentSeconds]');
        process.exit(1);
      }
      const produced = await streamAndSegment(url, outDir, Number(seg));
      console.log('Segments:', produced);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { streamAndSegment };

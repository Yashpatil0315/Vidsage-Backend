// transcribe_and_save.js
// Usage:
//   const { processJob } = require('./transcribe_and_save');
//   await processJob(filesArray, jobId, { whisperBin, modelPath, outDir, concurrency:1 });

const pLimit = require('p-limit').default; // npm i p-limit
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// runs whisper-cli on a single wav file and returns transcript (or throws)
function runWhisperOnFile(whisperBin, modelPath, wavPath, { threads = 1, timeoutMs = 5*60*1000, language } = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(wavPath)) return reject(new Error('wav not found: ' + wavPath));

    const args = ['-m', modelPath, '-f', wavPath, '-otxt'];
    if (threads) args.push('-t', String(threads));
    if (language) args.push('-l', language);

    const proc = spawn(whisperBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let out = '';
    let err = '';

    proc.stdout.on('data', (c) => { out += c.toString(); });
    proc.stderr.on('data', (c) => { err += c.toString(); });

    proc.on('error', (e) => reject(new Error('spawn error: ' + e.message)));

    const to = setTimeout(() => {
      proc.kill('SIGTERM');
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(to);
      if (code !== 0) {
        // fallback: some builds write wavPath + '.txt'
        const fallback = wavPath + '.txt';
        if (fs.existsSync(fallback)) {
          try {
            const fb = fs.readFileSync(fallback, 'utf8').trim();
            return resolve(fb);
          } catch (e) {
            // continue to reject
          }
        }
        return reject(new Error(`whisper exit ${code}. stderr: ${err}`));
      }
      resolve(out.trim());
    });
  });
}

/**
 * processJob
 * @param {string[]} files - ordered array of wav file paths (segments)
 * @param {string} jobId - job id to use for transcript filename
 * @param {object} options - {
 *     whisperBin, modelPath, outDir, concurrency = 1,
 *     threads = 1, timeoutMs = 300000, language, combine = true
 *   }
 * @returns {Promise<{ transcriptPath: string, perSegment: Array, combined: string }>}
 */
async function processJob(files, jobId, options = {}) {
  console.log('STEP 4: processJob entered');

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('files must be a non-empty array');
  }
  
  const {
    whisperBin = process.env.WHISPER_BIN || path.join(process.cwd(), 'whisper', 'whisper-cli.exe'),
    modelPath  = process.env.MODEL_PATH  || path.join(process.cwd(), 'whisper', 'models', 'ggml-base-q5_1.bin'),
    outDir = path.dirname(files[0]) || process.cwd(),
    concurrency = Number(options.concurrency || 1),
    threads = Number(options.threads || 3),
    timeoutMs = Number(options.timeoutMs || 5 * 60 * 1000),
    language = options.language,
    combine = options.combine ?? true
  } = options;

  // sanity checks
  if (!fs.existsSync(whisperBin)) throw new Error('whisper binary not found: ' + whisperBin);
  if (!fs.existsSync(modelPath)) throw new Error('model not found: ' + modelPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const limit = pLimit(concurrency);

  // create tasks
  const jobs = files.map((file, idx) => limit(async () => {
    try {
      const transcript = await runWhisperOnFile(whisperBin, modelPath, file, { threads, timeoutMs, language });
      return { index: idx, file, transcript, error: null };
    } catch (err) {
      return { index: idx, file, transcript: null, error: String(err) };
    }
  }));

  // run all jobs with concurrency cap
  const results = await Promise.all(jobs);
  // sort by original index
  results.sort((a,b) => a.index - b.index);

  // build combined transcript
  const perSegment = results.map(r => ({ file: r.file, transcript: r.transcript, error: r.error }));
  const combined = combine
    ? perSegment.map((p, i) => {
        const label = `Segment ${i + 1} (${path.basename(p.file)}):`;
        if (p.transcript) return `${label}\n${p.transcript}`;
        return `${label}\n[ERROR] ${p.error}`;
      }).join('\n\n')
    : '';

  const transcriptFilename = `${jobId}.txt`;
  const transcriptPath = path.join(outDir, transcriptFilename);

  // If any segment had an error, write error file and DO NOT delete wavs.
  const anyError = perSegment.some(p => p.error);

  if (anyError) {
    const errFilename = `${jobId}.err`;
    const errPath = path.join(outDir, errFilename);
    const errSummary = {
      jobId,
      timestamp: new Date().toISOString(),
      message: 'One or more segments failed to transcribe. See perSegment for details.',
      perSegment
    };
    fs.writeFileSync(errPath, JSON.stringify(errSummary, null, 2), 'utf8');
    // still write partial combined transcript (optional) to help debugging:
    try { fs.writeFileSync(transcriptPath, combined, 'utf8'); } catch(e){/*ignore*/}
    return { transcriptPath, perSegment, combined, error: true, errorPath: errPath };
  }

  // all good -> write transcript and delete wavs
  fs.writeFileSync(transcriptPath, combined, 'utf8');

  // delete wav files (best effort)
  for (const p of files) {
    try { fs.unlinkSync(p); } catch (e) { /* ignore deletion error */ }
    // also remove any fallback .txt left by whisper
    try { fs.unlinkSync(p + '.txt'); } catch (e) { /* ignore */ }
  }

  return { transcriptPath, perSegment, combined, error: false };
}

module.exports = { processJob };

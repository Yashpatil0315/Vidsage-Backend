// transcribe_and_save.js
// Usage:
//   const { processJob } = require('./transcribe_and_save');
//   await processJob(filesArray, jobId, { whisperBin, modelPath, outDir, concurrency:1 });

const pLimit = require('p-limit'); // npm i p-limit@3.1.1
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const jobStore = require("../service/jobStore");

let fullTranscript = "";


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
  console.log("STEP 4: processJob started");

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("files must be a non-empty array");
  }

  const {
    whisperBin = process.env.WHISPER_BIN,
    modelPath = process.env.MODEL_PATH,
    outDir = path.dirname(files[0]),
    concurrency = 1,
    threads = 3,
    timeoutMs = 5 * 60 * 1000
  } = options;

  if (!fs.existsSync(whisperBin)) throw new Error("whisper binary not found");
  if (!fs.existsSync(modelPath)) throw new Error("model not found");

  const limit = pLimit(concurrency);
  let fullTranscript = "";

  const jobs = files.map((file, index) =>
    limit(async () => {
      try {
        const transcript = await runWhisperOnFile(
          whisperBin,
          modelPath,
          file,
          { threads, timeoutMs }
        );

        // Append progressively
        fullTranscript += `\n${transcript}`;

        // Live update
        jobStore.update(jobId, {
          status: "processing",
          progress: `${index + 1}/${files.length}`,
          transcript: fullTranscript
        });

        // Cleanup intermediate files
        try {
          if (fs.existsSync(file)) fs.unlinkSync(file);
          const txtFile = file + '.txt';
          if (fs.existsSync(txtFile)) fs.unlinkSync(txtFile);
        } catch (cleanupErr) {
          console.error("Cleanup error for segment", index, cleanupErr.message);
        }

        return { index, transcript };
      } catch (err) {
        return { index, error: err.message };
      }
    })
  );

  await Promise.all(jobs);

  // Final write
  const transcriptPath = path.join(outDir, `${jobId}.txt`);
  fs.writeFileSync(transcriptPath, fullTranscript, "utf8");

  jobStore.update(jobId, {
    status: "completed",
    transcript: fullTranscript
  });

  return {
    transcriptPath,
    combined: fullTranscript,
    error: false
  };
}


module.exports = { processJob };

const path = require("path");
const fs = require("fs");
const { processJob } = require("../service/transcribeAndSave");
const jobStore = require("../service/jobStore");
const { streamAndSegment } = require("../service/segment_Stream");

exports.processAudio = async (req, res) => {
  try {
    const { url, segmentSeconds = 90 } = req.body;
    if (!url) return res.status(400).json({ error: "Missing video URL" });

    const jobId = `job_${Date.now()}`;
    const outDir = path.join(process.cwd(), "tmp_segments", jobId);

    fs.mkdirSync(outDir, { recursive: true });

    // 1️⃣ Create job
    jobStore.create({
      jobId,
      url,
      status: "processing",
      transcript: ""
    });

    // 2️⃣ Segment audio FIRST
    const files = await streamAndSegment(url, outDir, Number(segmentSeconds));

    // 3️⃣ Start transcription (non-blocking)
    const whisperBin = process.env.WHISPER_BIN || path.join(process.cwd(), "whisper", "whisper-cli.exe");
    const modelPath = process.env.WHISPER_MODEL || path.join(process.cwd(), "whisper", "models", "ggml-base-q5_1.bin");
    const concurrency = parseInt(process.env.WHISPER_CONCURRENCY) || 1;
    const threads = parseInt(process.env.WHISPER_THREADS) || 3;

    processJob(files, jobId, {
      whisperBin,
      modelPath,
      concurrency,
      threads
    }).catch(err => {
      console.error("Transcription error:", err);
      jobStore.update(jobId, { status: "error", error: err.message });
    });

    // 4️⃣ Respond immediately
    res.json({
      success: true,
      jobId,
      url,
      message: "Processing started"
    });

  } catch (err) {
    console.error("processAudio error:", err);
    res.status(500).json({ error: err.message });
  }
};


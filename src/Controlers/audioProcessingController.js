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
      status: "processing",
      transcript: ""
    });

    // 2️⃣ Segment audio FIRST
    const files = await streamAndSegment(url, outDir, Number(segmentSeconds));

    // 3️⃣ Start transcription (non-blocking)
    processJob(files, jobId, {
      whisperBin: path.join(process.cwd(), "whisper", "whisper-cli.exe"),
      modelPath: path.join(process.cwd(), "whisper", "models", "ggml-base-q5_1.bin"),
      concurrency: 1,
      threads: 3
    }).catch(err => {
      console.error("Transcription error:", err);
      jobStore.update(jobId, { status: "error", error: err.message });
    });

    // 4️⃣ Respond immediately
    res.json({
      success: true,
      jobId,
      message: "Processing started"
    });

  } catch (err) {
    console.error("processAudio error:", err);
    res.status(500).json({ error: err.message });
  }
};


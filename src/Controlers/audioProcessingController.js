const path = require("path");
const fs = require("fs");
const { streamAndSegment } = require("../service/segment_Stream");
const { processJob } = require("../service/transcribeAndSave");

exports.processAudio = async (req, res) => {
  try {
    const { url, segmentSeconds = 90 } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Missing video URL" });
    }

    const jobId = `job_${Date.now()}`;
    const outDir = path.join(process.cwd(), "tmp_segments", jobId);

    fs.mkdirSync(outDir, { recursive: true });

    console.log("Starting segmentation...");
    const files = await streamAndSegment(url, outDir, Number(segmentSeconds));

    console.log("Segmentation done. Starting transcription...");
    const result = await processJob(files, jobId, {
      whisperBin: path.join(process.cwd(), "whisper", "whisper-cli.exe"),
      modelPath: path.join(process.cwd(), "whisper", "models", "ggml-base-q5_1.bin"),
      outDir,
      concurrency: 1,
      threads: 3
    });

    res.json({
      success: true,
      jobId,
      transcriptPath: result.transcriptPath
    });

  } catch (err) {
    console.error("Error in processAudio:", err);
    res.status(500).json({ error: err.message });
  }
};



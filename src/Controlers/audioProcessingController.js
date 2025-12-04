const path = require("path");
const fs = require("fs");
const { streamAndSegment } = require("../service/segment_Stream"); // adjust path

// Express controller wrapper
exports.processAudio = async (req, res) => {
  try {
    const { url, segmentSeconds = 30 } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Missing video URL" });
    }

    const jobId = `job_${Date.now()}`;
    const outDir = path.join(__dirname, "../../tmp_segments", jobId);

    fs.mkdirSync(outDir, { recursive: true });

    // Call your segmentation function
    const files = await streamAndSegment(url, outDir, Number(segmentSeconds));

    res.json({
      message: "Audio processing complete",
      jobId,
      files,
      outDir
    });

  } catch (err) {
    console.error("Error in processAudio:", err);
    res.status(500).json({ error: err.message });
  }
};


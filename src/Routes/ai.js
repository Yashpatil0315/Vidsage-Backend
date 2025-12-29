const express = require("express");
const router = express.Router();
const { askAI } = require("../service/aiService");
const jobStore = require("../service/jobStore");

router.post("/ask", async (req, res) => {
  const { jobId, question } = req.body;

  if (!jobId || !question) {
    return res.status(400).json({ error: "Missing jobId or question" });
  }

  const job = jobStore.get(jobId);
  if (!job || !job.transcript) {
    return res.status(404).json({ error: "Transcript not found" });
  }

  try {
    const answer = await askAI({
      transcript: job.transcript,
      question
    });

    res.json({ answer });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI processing failed" });
  }
});

module.exports = router;

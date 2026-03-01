const express = require('express');
const router = express.Router();
const jobStore = require("../service/jobStore");


// GET /job/:jobId
router.get("/:jobId", (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Not found" });

  res.json(job);
});

module.exports = router;
const aiSessionStore = require("../service/aiSessionStore");
const jobStore = require("../service/jobStore");
const { askAIService } = require("../service/aiService");

exports.askQuestion = async (req, res) => {
  try {
    const { question, jobId } = req.body;

    if (!question || !jobId) {
      return res.status(400).json({ error: "Missing question or jobId" });
    }

    const userId = req.user._id || req.user.id; // JWT payload

    // 1️⃣ Get job
    const job = jobStore.get(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const transcript = job.transcript || "";

    // 2️⃣ Get private AI memory
    const history = aiSessionStore.getSession(userId, jobId);

    // 3️⃣ Make it safe
    const safeHistory = Array.isArray(history) ? history : [];

    // 4️⃣ Ask AI
    const answer = await askAIService({
      transcript,
      question,
      history: safeHistory
    });

    // 5️⃣ Update private memory (per-user, per-video)
    aiSessionStore.append(userId, jobId, "user", question);
    aiSessionStore.append(userId, jobId, "assistant", answer);

    // 6️⃣ Respond
    res.json({ answer });

  } catch (err) {
    console.error("AI error FULL:", err);
    res.status(500).json({
      error: "AI processing failed",
      details: err.message
    });
  }
};

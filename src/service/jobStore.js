const jobs = new Map();

module.exports = {
  create(job) {
    jobs.set(job.jobId, job);
  },

  update(jobId, data) {
    const job = jobs.get(jobId);
    if (!job) return;
    jobs.set(jobId, { ...job, ...data });
  },

  appendTranscript(jobId, text) {
    const job = jobs.get(jobId);
    if (!job) return;

    job.transcript = (job.transcript || "") + "\n" + text;
    job.updatedAt = new Date();
  },

  get(jobId) {
    return jobs.get(jobId);
  }
};

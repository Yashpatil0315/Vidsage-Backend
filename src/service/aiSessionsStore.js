const sessions = new Map();

module.exports = {
  getSession(userId, jobId) {
    const key = `${userId}:${jobId}`;
    if (!sessions.has(key)) {
      sessions.set(key, []);
    }
    return sessions.get(key);
  },

  append(userId, jobId, role, content) {
    const session = this.getSession(userId, jobId);
    session.push({ role, content });
  }
};

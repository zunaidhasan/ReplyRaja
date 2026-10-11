const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

/**
 * Async Job Queue Worker Engine (Sections 4.2 & 5.1)
 * Handles durable background processing for:
 * 1. channel_inbound_message
 * 2. ai_draft_generation
 * 3. outbound_channel_delivery
 * 4. order_notification
 */

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.processedCount = 0;
  }

  enqueue(type, payload, options = {}) {
    const jobId = 'job_' + uuidv4().substring(0, 8);
    const job = {
      id: jobId,
      type,
      payload,
      status: 'pending',
      workspace_id: payload.workspace_id || 'ws_demo_1',
      request_id: payload.request_id || null,
      created_at: new Date().toISOString(),
      attempts: 0,
      max_attempts: options.max_attempts || 3
    };

    this.jobs.set(jobId, job);
    
    // Process asynchronously (non-blocking)
    setImmediate(() => this.processJob(jobId));

    return job;
  }

  async processJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.attempts += 1;

    try {
      this.emit(`job:${job.type}`, job);
      job.status = 'completed';
      job.completed_at = new Date().toISOString();
      this.processedCount += 1;
    } catch (err) {
      job.status = job.attempts >= job.max_attempts ? 'failed' : 'retrying';
      job.error = err.message;
      if (job.status === 'retrying') {
        setTimeout(() => this.processJob(jobId), 1000);
      }
    }
  }

  getMetrics() {
    return {
      active_jobs: Array.from(this.jobs.values()).filter(j => j.status === 'processing').length,
      completed_jobs: this.processedCount,
      failed_jobs: Array.from(this.jobs.values()).filter(j => j.status === 'failed').length
    };
  }
}

const queue = new JobQueue();

module.exports = queue;

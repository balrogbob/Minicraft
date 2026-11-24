// (v48) Builds chunk meshes off the main thread: see MeshPool in world.js and meshJob in mesher.js.
import { meshJob, resultBuffers } from './mesher.js';

self.onmessage = (e) => {
  const job = e.data;
  try {
    const r = meshJob(job);
    r.seq = job.seq; r.key = job.key;
    self.postMessage(r, resultBuffers(r));
  } catch (err) {
    self.postMessage({ seq: job.seq, key: job.key, error: String(err?.stack ?? err) });
  }
};

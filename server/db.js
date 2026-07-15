const fs = require("fs").promises;
const path = require("path");

const dbPath = path.join(__dirname, "db.json");

// Ensure the db.json file exists with initial schema
async function initDb() {
  try {
    await fs.access(dbPath);
  } catch (err) {
    const initialData = { scans: {}, batches: {} };
    await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2), "utf8");
  }
}

// Read database helper
async function readDb() {
  try {
    const data = await fs.readFile(dbPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return { scans: {}, batches: {} };
  }
}

// Transaction queue to serialize read-modify-write blocks
let transactionQueue = Promise.resolve();

async function runTransaction(updateFn) {
  return new Promise((resolve, reject) => {
    transactionQueue = transactionQueue.then(async () => {
      try {
        await initDb();
        const db = await readDb();
        const updatedDb = await updateFn(db);
        await fs.writeFile(dbPath, JSON.stringify(updatedDb, null, 2), "utf8");
        resolve(updatedDb);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Public API methods
async function saveScan(url, result) {
  await runTransaction(async (db) => {
    db.scans[url] = {
      result,
      timestamp: new Date().toISOString(),
    };
    return db;
  });
}

async function getScan(url) {
  const db = await readDb();
  return db.scans[url] || null;
}

async function saveBatch(batchId, batchData) {
  await runTransaction(async (db) => {
    db.batches[batchId] = batchData;
    return db;
  });
}

async function getBatch(batchId) {
  const db = await readDb();
  return db.batches[batchId] || null;
}

async function updateBatch(batchId, updateFn) {
  await runTransaction(async (db) => {
    if (db.batches[batchId]) {
      db.batches[batchId] = updateFn(db.batches[batchId]);
    }
    return db;
  });
}

async function cleanupOldRecords() {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  await runTransaction(async (db) => {
    // Clean up single scans
    if (db.scans) {
      for (const [url, scan] of Object.entries(db.scans)) {
        if (scan.timestamp && new Date(scan.timestamp).getTime() < thirtyDaysAgo) {
          delete db.scans[url];
        }
      }
    }
    // Clean up batches
    if (db.batches) {
      for (const [batchId, batch] of Object.entries(db.batches)) {
        if (batch.createdAt && new Date(batch.createdAt).getTime() < thirtyDaysAgo) {
          delete db.batches[batchId];
        }
      }
    }
    return db;
  });
}

module.exports = {
  initDb,
  saveScan,
  getScan,
  saveBatch,
  getBatch,
  updateBatch,
  cleanupOldRecords,
};

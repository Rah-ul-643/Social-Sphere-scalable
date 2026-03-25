const Message = require('./models/messages');
const Group   = require('./models/groups');


async function saveBatch(incomingMessages) {
  if (!incomingMessages.length) return;

  const insertedDocs = await insertMessages(incomingMessages);
  if (!insertedDocs.length) return; // all duplicates, nothing to link

  await linkMessagesToGroups(insertedDocs);
}

// ── private helpers ───────────────────────────────────────────────────────────

async function insertMessages(incomingMessages) {
  const docs = incomingMessages.map((m) => ({
    sender:    m.sender,
    message:   m.content, 
    messageId: m.messageId,
    groupId:   m.groupId,
    timestamp: m.timestamp,
  }));

  try {
    const result = await Message.insertMany(docs, { ordered: false });
    console.log(`[DB] Inserted ${result.length} message(s)`);
    return result;
  } catch (err) {
    if (isDuplicateOnlyError(err)) {
      console.warn('[DB] Batch was all duplicates — skipping');
      return [];
    }
    throw err;
  }
}

async function linkMessagesToGroups(insertedDocs) {
  // Build a map: groupId → [_id, _id, ...]
  const idsPerGroup = {};
  for (const doc of insertedDocs) {
    if (!idsPerGroup[doc.groupId]) idsPerGroup[doc.groupId] = [];
    idsPerGroup[doc.groupId].push(doc._id);
  }

  const bulkOps = Object.entries(idsPerGroup).map(([groupId, ids]) => ({
    updateOne: {
      filter: { group_id: groupId },
      update: { $push: { messages: { $each: ids } } },
    },
  }));

  try {
    await Group.bulkWrite(bulkOps, { ordered: false });
    console.log(`[DB] Linked messages to ${bulkOps.length} group(s)`);
  } catch (err) {
    // Messages are saved but not linked — API cannot see them.
    // Re-throw so service.js re-queues the batch.
    console.error('[DB] Failed to link messages to groups:', err.message);
    throw err;
  }
}

function isDuplicateOnlyError(err) {
  return (
    err.code === 11000 ||
    (err.writeErrors && err.writeErrors.every((e) => e.code === 11000))
  );
}

module.exports = { saveBatch };
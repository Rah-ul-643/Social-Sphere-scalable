const { v4: uuidv4 } = require('uuid');

const groups = require('../models/groups');
const users = require('../models/users');

// -------------------- EXISTING HANDLERS --------------------

const searchQueryHandler = async (req, res) => {
    const { searchQuery } = req.query;
    if (!searchQuery) return res.json({ searchResult: [] });
    try {
        const results = await users
            .find({ username: { $regex: '^' + searchQuery, $options: 'i' } }, 'name username')
            .limit(10);
        res.json({ searchResult: results });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const joinGroupHandler = async (req, res) => {
    try {
        const { groupId } = req.body;
        const username = req.username;
        const group = await groups.findOne({ group_id: groupId });

        if (!group) return res.status(200).json({ success: false, message: 'Invalid Code!' });

        if (group.join_requests.includes(username)) {
            return res.status(200).json({ success: false, message: 'Request already sent. Please wait for admin to respond...' });
        }

        group.join_requests.push(username);
        await group.save();
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createGroupHandler = async (req, res) => {
    try {
        const { groupName } = req.body;
        const username = req.username;

        const newGroup = new groups({
            group_id: uuidv4(),
            group_name: groupName,
            admin: username,
            participants: [username],
        });
        await newGroup.save();

        const { group_id, group_name } = newGroup;
        res.status(200).json({ success: true, group: { group_id, group_name } });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addParticipant = async (req, res) => {
    try {
        const { username, groupId } = req.body;
        const user = await users.findOne({ username }).exec();
        if (!user) return res.status(200).json({ success: false, message: 'Invalid username!' });

        const group = await groups.findOne({ group_id: groupId });
        if (group.participants.includes(username)) {
            return res.status(200).json({ success: false, message: 'Already a member!' });
        }

        group.participants.push(username);
        await group.save();
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const groupDataHandler = async (req, res) => {
    try {
        const { group_id } = req.query;
        const groupDetails = await groups.findOne({ group_id }, '-messages').exec();
        if (!groupDetails) return res.status(404).json({ success: false });
        res.status(200).json({ success: true, groupDetails });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const joinRequestResponseHandler = async (req, res) => {
    try {
        const user = req.username;
        const { group_id, acceptStatus, username } = req.query;

        const group = await groups.findOne({ group_id }, '-messages').exec();
        if (user !== group.admin) return res.status(401).json({ message: 'unauthorized' });

        if (acceptStatus === 'true') group.participants.push(username);
        group.join_requests = group.join_requests.filter((u) => u !== username);

        await group.save();
        res.status(200).json({ success: true, groupList: group });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const leaveGroupHandler = async (req, res) => {
    try {
        const { group_id } = req.query;
        const username = req.username;
        const group = await groups.findOne({ group_id }).exec();

        if (group.participants.length === 1) {
            await groups.findOneAndDelete({ group_id });
            return res.status(200).json({ success: true });
        }

        if (username === group.admin) {
            return res.status(200).json({ success: false, message: 'Admin cannot leave. Transfer ownership first.' });
        }

        group.participants = group.participants.filter((u) => u !== username);
        await group.save();
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const removeParticipant = async (req, res) => {
    try {
        const executor = req.username;
        const { groupId, username } = req.query;

        const user = await users.findOne({ username }).exec();
        if (!user) return res.status(200).json({ success: false, message: 'Invalid username!' });

        const group = await groups.findOne({ group_id: groupId });
        if (executor !== group.admin) {
            return res.status(401).json({ success: false, message: 'Unauthorized action!' });
        }

        if (!group.participants.includes(username)) {
            return res.status(200).json({ success: false, message: 'User not in group!' });
        }

        group.participants = group.participants.filter((u) => u !== username);
        await group.save();
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// -------------------- NEW HANDLERS --------------------

/**
 * GET /api/chat/conversations
 *
 * Returns all groups the authenticated user is a participant of.
 * Used by the client on initial load (replaces the old socket
 * "retrieve-conversations" event that tried to query the DB from
 * the WS server).
 *
 * Response: { conversations: [{ group_id, group_name, admin, updatedAt }] }
 */
const getConversationsHandler = async (req, res) => {
    try {
        const username = req.username;

        const userGroups = await groups
            .find({ participants: username }, 'group_id group_name admin updatedAt')
            .sort({ updatedAt: -1 })
            .exec();

        res.status(200).json({ success: true, conversations: userGroups });
    } catch (error) {
        console.error('[API] getConversations error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

/**
 * GET /api/chat/messages?groupId=<id>&page=<n>&limit=<n>
 *
 * Returns paginated message history for a group, oldest-first within the page.
 * Used by the client whenever a user opens a chat (replaces the old socket
 * "chat-history" event that queried the DB directly from the WS server).
 *
 * Access control: only participants of the group can fetch messages.
 *
 * Query params:
 *   groupId  (required)
 *   page     (optional, default 1)
 *   limit    (optional, default 50)
 *
 * Response: { messages: [...], total, page, limit }
 */
const getMessagesHandler = async (req, res) => {
    try {
        const { groupId } = req.query;
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
        const username = req.username;

        if (!groupId) return res.status(400).json({ message: 'groupId is required' });

        // Access control — only group participants may read messages
        const group = await groups.findOne({ group_id: groupId, participants: username }).exec();
        if (!group) return res.status(403).json({ success: false, message: 'Access denied or group not found' });

        const total = group.messages.length;
        const skip = (page - 1) * limit;

        // Populate the message refs with full message documents, sorted oldest-first
        const populated = await groups
            .findOne({ group_id: groupId })
            .populate({
                path: 'messages',
                options: { sort: { createdAt: 1 }, skip, limit },
            })
            .exec();

        res.status(200).json({
            success: true,
            messages: populated.messages,
            total,
            page,
            limit,
        });
    } catch (error) {
        console.error('[API] getMessages error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    // existing
    searchQueryHandler,
    joinGroupHandler,
    createGroupHandler,
    addParticipant,
    removeParticipant,
    groupDataHandler,
    joinRequestResponseHandler,
    leaveGroupHandler,
    // new
    getConversationsHandler,
    getMessagesHandler,
};

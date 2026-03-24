const router = require('express').Router();

const {
        searchQueryHandler,
        joinGroupHandler,
        createGroupHandler,
        addParticipant,
        removeParticipant,
        groupDataHandler,
        joinRequestResponseHandler,
        leaveGroupHandler,
        getConversationsHandler,
        getMessagesHandler,
} = require('../controllers/chatController');

router.get('/search', searchQueryHandler);

router.post('/join-group', joinGroupHandler);
router.post('/create-group', createGroupHandler);

router.post('/add-participant', addParticipant);
router.delete('/remove-participant', removeParticipant);

router.get('/group', groupDataHandler);

router.put('/join-request-response', joinRequestResponseHandler);
router.delete('/leave-group', leaveGroupHandler);

router.get('/conversations', getConversationsHandler);
router.get('/messages', getMessagesHandler);

module.exports = router;
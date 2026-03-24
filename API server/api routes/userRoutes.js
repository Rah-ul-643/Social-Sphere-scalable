const router = require('express').Router();

const {loginController, registerController, fetchProfileController, updateProfileController} = require('../controllers/userController');

router.post('/login', loginController);
router.post('/register', registerController);

router.get('/profile', fetchProfileController);
router.put('/profile', updateProfileController);

module.exports = router;
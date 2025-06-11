const express = require('express');
const router = express.Router();
const upload = require('../middlewares/Upload');
const jwtConfig = require('../config/jwtconfig');
const authController = require('../controller/authController');

router.post('/login', authController.login);
router.get('/getUserById/:id', jwtConfig.requireAuth, authController.getUserById);
router.post('/import', jwtConfig.requireAdmin, upload.single('file'), authController.importUsersFromExcel);


module.exports = router;

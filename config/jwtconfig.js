const dotenv = require("dotenv");
dotenv.config();
const jwt = require('jsonwebtoken');

const jwtConfig = {
    secret: process.env.JWT_SECRET || 'secret_key',
    expiresIn: '1d',

    generateToken(payload) {
        return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
    },

    verifyJwt(token) {
        try {
            return jwt.verify(token, this.secret);
        } catch (err) {
            return null;
        }
    },

    requireAuth(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwtConfig.verifyJwt(token);

        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = decoded;
        next();
    },

    requireAdmin(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwtConfig.verifyJwt(token);

        if (!decoded || decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admins only' });
        }

        req.user = decoded;
        next();
    }
};

module.exports = jwtConfig;

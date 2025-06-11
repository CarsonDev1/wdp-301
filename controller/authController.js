const User = require('../model/user');
const XLSX = require('xlsx');
const jwtConfig = require('../config/jwtconfig');

exports.login = async (req, res) => {
    const { studentId, password } = req.body;
    try {
        const user = await User.findOne({ studentId });

        if (!user) return res.status(404).json({ message: 'User not found' });
        console.log('Đăng nhập studentId:', user.studentId);
        // const isMatch = await user.comparePassword(password);
        // if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

        const token = jwtConfig.generateToken({ id: user._id, role: user.role });

        if (user.mustChangePassword) {
            return res.status(200).json({
                message: 'Password change required',
                mustChangePassword: true,
                token,
                user: { id: user._id, name: user.name, studentId: user.studentId }
            });
        }

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, studentId: user.studentId, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.importUsersFromExcel = async (req, res) => {
    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const users = XLSX.utils.sheet_to_json(sheet);

        const inserted = [];
        const skipped = [];

        for (const item of users) {
            const exists = await User.findOne({ studentId: item.studentId });
            if (exists) {
                skipped.push({ studentId: item.studentId, reason: 'Already exists' });
                continue;
            }

            const user = new User({
                studentId: item.studentId,
                name: item.name,
                password: item.password || item.studentId,
                email: item.email,
                phone: item.phone,
                address: item.address,
                mustChangePassword: true
            });

            await user.save();
            inserted.push(user.studentId);
        }

        res.status(200).json({
            message: 'Import completed'
        });
    } catch (err) {
        res.status(500).json({ message: 'Import failed', error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    const { studentId, newPassword } = req.body;
    try {
        const user = await User
            .findOneAndUpdate(
                { studentId },
                { password: newPassword, mustChangePassword: false },
                { new: true }
            );
        if (!user) return res.status(404).json({ message: 'User not found' });
        const token = jwtConfig.generateToken({ id: user._id, role: user.role });
        res.status(200).json({
            message: 'Password changed successfully',
            token,
            user: { id: user._id, name: user.name, studentId: user.studentId, role: user.role }
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Ẩn mật khẩu
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            id: user._id,
            name: user.name,
            studentId: user.studentId,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            mustChangePassword: user.mustChangePassword
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
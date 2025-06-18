import express from 'express';
import { sendError, sendSuccess } from '../utils/helpers/response.helper.js';

const router = express.Router();

// Dữ liệu giả (trong thực tế sẽ kết nối với database)
let users = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@email.com', age: 25 },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@email.com', age: 30 },
    { id: 3, name: 'Lê Văn C', email: 'levanc@email.com', age: 28 },
];

// GET /api/users - Lấy danh sách tất cả users
router.get('/', (req, res) => {
    res.json({
        message: 'Lấy danh sách users thành công',
        data: users,
        total: users.length,
    });
});

// GET /api/users/:id - Lấy thông tin user theo ID
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find((u) => u.id === id);

    if (!user) {
        return res.status(404).json({
            message: 'Không tìm thấy user',
            status: 'error',
        });
    }

    return res.json({
        message: 'Lấy thông tin user thành công',
        data: user,
    });
});

// POST /api/users - Tạo user mới
router.post('/', (req, res) => {
    const { name, email, age } = req.body;

    if (!name || !email) {
        return sendError(res, 'Name and email are required', '', 400);
    }

    const newUser = {
        id: users.length + 1,
        name,
        email,
        age: age || 0,
    };

    users.push(newUser);

    res.status(201).json({
        message: 'Tạo user thành công',
        data: newUser,
    });
});

// PUT /api/users/:id - Cập nhật user
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
        return sendError(res, 'User not found', '', 404);
    }

    const { name, email, age } = req.body;

    users[userIndex] = {
        ...users[userIndex],
        ...(name && { name }),
        ...(email && { email }),
        ...(age && { age }),
    };

    return sendSuccess(res, users[userIndex], 'Update user successfully');
});

// DELETE /api/users/:id - Xóa user
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
        return sendError(res, 'User not found', '', 404);
    }

    const deletedUser = users.splice(userIndex, 1)[0];

    return sendSuccess(res, deletedUser, 'Delete user successfully');
});

export default router;

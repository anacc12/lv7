const mongoose = require('mongoose');

var userSchema = new mongoose.Schema(
    {
        username: String,
        password: String,
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    { collection: 'users' },
);

module.exports = mongoose.model('user', userSchema);

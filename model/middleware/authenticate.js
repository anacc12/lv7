var User = require('../users');
var bcrypt = require('bcryptjs');

exports.authenticate = function (username, password, fn) {
    User.findOne({ username: username }, function (err, user) {
        if (err) return fn(err);
        if (user == null) return fn();
        if (bcrypt.compareSync(password, user.password)) {
            return fn(null, user);
        } else {
            return fn();
        }
    });
};

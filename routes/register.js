var User = require('../model/users');
var bcrypt = require('bcryptjs');

exports.form = function (req, res) {
    res.render('users/register', { title: 'Register' });
};

exports.submit = function (req, res, next) {
    User.findOne({ username: req.body.username }, function (err, user) {
        if (err) return next(err);
        if (user) {
            res.error('This username is taken!');
            res.redirect('back');
        } else {
            const pass = bcrypt.hashSync(req.body.password, 10);
            user = User.create(
                {
                    username: req.body.username,
                    password: pass,
                },
                function (err) {
                    if (err) {
                        res.send('There was a problem with adding the user.');
                    } else {
                        res.redirect('/');
                    }
                },
            );
        }
    });
};

var Auth = require('../model/middleware/authenticate');

exports.form = function (req, res) {
    res.render('users/login', { title: 'Login' });
};

exports.submit = function (req, res, next) {
    Auth.authenticate(
        req.body.username,
        req.body.password,
        function (err, user) {
            if (err) return next(err);
            if (user) {
                req.session.uid = user.id;
                res.redirect('/');
            } else {
                res.error('Wrong credentials!');
                res.redirect('back');
            }
        },
    );
};

exports.logout = function (req, res) {
    req.session.destroy(function (err) {
        if (err) throw err;
        res.redirect('/');
    });
};

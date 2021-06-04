var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

var session = require('express-session');
var indexRouter = require('./routes/index');
var projectRouter = require('./routes/projects');
var login = require('./routes/login');
var register = require('./routes/register');
var messages = require('./model/messages');
var user = require('./model/middleware/user');

var app = express();
app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    }),
);
app.use(messages);
app.use(user);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/projects', checkUser, projectRouter);
app.get('/register', register.form);
app.post('/register', register.submit);
app.get('/login', login.form);
app.post('/login', login.submit);
app.get('/logout', login.logout);

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

mongoose.connect('mongodb://127.0.0.1/lv77', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
});

function checkUser(req, res, next) {
    if (req.session.uid == null) {
        res.redirect('/login');
    } else {
        next();
    }
}

module.exports = app;

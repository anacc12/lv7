var express = require('express');
var res = express.response;

res.message = function (msg, type) {
    type = type || 'info';
    var session = this.req.session;
    session.messages = session.messages || [];
    session.messages.push({ type: type, string: msg });
};

res.error = function (msg) {
    return this.message(msg, 'success');
};

module.exports = function (req, res, next) {
    res.locals.messages = req.session.messages || [];
    req.session.messages = [];
    next();
};

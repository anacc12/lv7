var express = require('express');
var router = express.Router();
const Project = require('../model/projects');
const User = require('../model/users');
const Joi = require('joi');
const methodOverride = require('method-override');

router.use(
    methodOverride(function (req, res) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
            var method = req.body._method;
            delete req.body._method;
            return method;
        }
    }),
);

router.get('/', function (req, res, next) {
    var role = req.query.role;
    if (role == null) {
        req.session.rol = 'owner';
        role = 'owner';
    }
    if (role == 'owner') {
        var filter = { vlasnik: req.session.uid, arhivirano: false };
        var isOwner = true;
    } else {
        var filter = { clanovi: req.session.uid, arhivirano: false };
        var isOwner = false;
    }
    Project.find(filter, function (err, projects) {
        if (err) {
            return console.error(err);
        } else {
            projects.map(function (project) {
                var names = [];
                project.clanovi.forEach(function (clan) {
                    names.push(clan.username);
                });
                project.clanovi = names.join(', ');
            });
            var role = isOwner ? 'Owner' : 'Member';
            res.format({
                html: function () {
                    res.render('projects/index', {
                        title: 'Projects - ' + role,
                        projects: projects,
                        isOwner: isOwner,
                    });
                },
                json: function () {
                    res.json(projects);
                },
            });
        }
    })
        .populate('clanovi', { username: 1 })
        .sort({ created_at: -1 });
});



router.get('/add', function (req, res) {
    User.find({ _id: { $ne: req.session.uid } }, function (err, users) {
        if (err) {
            res.render('/projects');
        } else {
            users.map(function (user) {
                delete user.password;
                delete user.projects;
                delete user.createdAt;
                delete user.updatedAt;
            });
            res.format({
                html: function () {
                    res.render('projects/add', {
                        title: 'Add New Project',
                        users: users,
                    });
                },
                json: function () {
                    res.json(users);
                },
            });
        }
    });
});

const ser = Joi.object({
    project_name: Joi.string().required(),
    project_description: Joi.string().required(),
    jobs_done: Joi.string().required(),
    project_price: Joi.number().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
});

router.post('/create', function (req, res, next) {
    var memberIds = req.body['clanovi[]'];
    delete req.body['clanovi[]'];
    const result = ser.validate(req.body);
    if (result.error) {
        return res.status(400).send(result.error);
    }

    Project.create(
        {
            vlasnik: req.session.uid,
            naziv: result.value.project_name,
            opis: result.value.project_description,
            obavljeno: result.value.jobs_done,
            cijena: result.value.project_price,
            pocetak: result.value.start_date,
            zavrsetak: result.value.end_date,
            clanovi: memberIds,
        },
        function (err, project) {
            if (err) {
                res.send('There was a problem with adding the project.');
            } else {
                res.format({
                    html: function () {
                        res.location('projects');
                        res.redirect('/projects?role=owner');
                    },
                });
            }
        },
    );
});

router.get('/:id', function (req, res, next) {
    const id = req.params.id;
    if (id == null || id.length != 24) {
        return res.status(400).send('Invalid project ID');
    }
    Project.findById(id, function (err, project) {
        if (err) {
            res.render('/projects');
        } else {
            if (project.vlasnik == req.session.uid ||
                (project.clanovi != null && project.clanovi.indexOf(req.session.uid) >= 0)){
                var names = [];
                project.clanovi.forEach(function (clan) {
                    names.push(clan.username);
                });
                project.clanovi = names;
                res.format({
                    html: function () {
                        res.render('projects/show', {
                            title: 'Show Project',
                            project: project,
                        });
                    },
                    json: function () {
                        res.json(project);
                    },
                });
            } else {
                res.error('Nedostupno');
                res.redirect('/projects');
            }
        }
    }).populate('clanovi', { username: 1 });
});



router.get('/edit/:id', function (req, res, next) {
    const id = req.params.id;
    if (id == null || id.length != 24) {
        return res.status(400).send('Invalid project ID');
    }
    Project.findById(id, function (err, project) {
        if (err) {
            res.render('/projects');
        } else {
            if (project.vlasnik == req.session.uid ||
                (project.clanovi != null && project.clanovi.indexOf(req.session.uid) >= 0)) {
                User.find(
                    { _id: { $ne: req.session.uid } },
                    function (err, users) {
                        if (err) {
                            res.render('/projects');
                        } else {
                            users.map(function (user) {
                                delete user.password;
                                delete user.projects;
                                delete user.createdAt;
                                delete user.updatedAt;
                            });

                            var pocetak = project.pocetak.toISOString();
                            var zavrsetak = project.zavrsetak.toISOString();

                            pocetak = pocetak.substring(
                                0,
                                pocetak.indexOf('T'),
                            );
                            zavrsetak = zavrsetak.substring(
                                0,
                                zavrsetak.indexOf('T'),
                            );

                            users.map(function (user) {
                                user.isSelected =
                                    project.clanovi.indexOf(user._id) != -1;
                            });

                            res.format({
                                html: function () {
                                    res.render('projects/edit', {
                                        title: 'Edit Project',
                                        project: project,
                                        pocetak: pocetak,
                                        zavrsetak: zavrsetak,
                                        isOwner:
                                            project.vlasnik == req.session.uid,
                                        users: users,
                                    });
                                },
                                json: function () {
                                    res.json(project, users);
                                },
                            });
                        }
                    },
                );
            } else {
                res.error('Nedostupno');
                res.redirect('/projects');
            }
        }
    });
});

router.get('/archive-projects', function (req, res) {
    var query = {
        $or: [{ vlasnik: req.session.uid }, { clanovi: req.session.uid }],
        arhivirano: true,
    };
    Project.find(query, function (err, projects) {
        if (err) {
            return console.error(err);
        } else {
            projects.map(function (project) {
                if (project.vlasnik == req.session.uid) {
                    project.isOwner = true;
                } else {
                    project.isOwner = false;
                }
            });
            res.format({
                html: function () {
                    res.render('projects/archive', {
                        title: 'Arhivirano',
                        projects: projects,
                    });
                },
                json: function () {
                    res.json(projects);
                },
            });
        }
    }).sort({ created_at: -1 });
});

router.get('/archive/:id', function (req, res, next) {
    const id = req.params.id;
    if (id == null || id.length != 24) {
        return res.status(400).send('Invalid project ID');
    }
    Project.findById(id, function (err, project) {
        if (err) {
            res.render('/projects');
        } else {
            if (project.vlasnik == req.session.uid) {
                project.update(
                    {
                        arhivirano: true,
                    },
                    function (err, project) {
                        if (err) {
                            res.send(
                                'There was a problem with updating a project.',
                            );
                        } else {
                            res.format({
                                html: function () {
                                    res.message(
                                        'Success!',
                                    );
                                    res.redirect('/projects');
                                },
                            });
                        }
                    },
                );
            } else {
                res.error('Nedostupno');
                res.redirect('/projects');
            }
        }
    });
});

router.delete('/delete/:id', function (req, res, next) {
    Project.findById(req.params.id, function (err, project) {
        if (err) {
            res.render('/projects');
            console.error(err);
        } else {
            if (project.vlasnik == req.session.uid) {
                project.remove(function (err, project) {
                    if (err) {
                        res.render('/projects');
                        console.error(err);
                    } else {
                        res.format({
                            html: function () {
                                res.location('projects');
                                res.redirect('/projects');
                            },
                        });
                    }
                });
            } else {
                res.error('Nedostupno');
                res.redirect('/projects');
            }
        }
    });
});

router.put('/update/:id', function (req, res, next) {
    var isOwner = req.body.isOwner;
    delete req.body.isOwner;

    if (isOwner == 'true') {
        var memberIds = req.body['clanovi[]'];
        var filteredIds = [];
        if (memberIds.length > 0) {
            memberIds.forEach(function (id) {
                if (id.length == 24) {
                    filteredIds.push(id);
                }
            });
        }
        delete req.body['clanovi[]'];

        const result = ser.validate(req.body);
        if (result.error) {
            return res.status(400).send(result.error);
        }
        var parameters = {
            naziv: result.value.project_name,
            opis: result.value.project_description,
            obavljeno: result.value.jobs_done,
            cijena: result.value.project_price,
            pocetak: result.value.start_date,
            zavrsetak: result.value.end_date,
            clanovi: filteredIds,
        };
    } else {
        var parameters = { obavljeno: req.body['jobs_done'] };
    }
    const id = req.params.id;
    if (id == null || id.length != 24) {
        return res.status(400).send('Invalid project ID');
    }
    Project.findById(id, function (err, project) {
        if (project.vlasnik == req.session.uid ||
            (project.clanovi != null && project.clanovi.indexOf(req.session.uid) >= 0)) {
            project.update(parameters, function (err, project) {
                if (err) {
                    res.send('There was a problem with updating a project.');
                } else {
                    var role =
                        isOwner == 'true' ? '?role=owner' : '?role=member';
                    res.format({
                        html: function () {
                            res.location('projects');
                            res.redirect('/projects' + role);
                        },
                    });
                }
            });
        } else {
            res.error('Nedostupno');
            res.redirect('/projects');
        }
    });
});




module.exports = router;

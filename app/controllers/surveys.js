'use strict';

const mongoose = require('mongoose');
const controller = require('lib/wiring/controller');
const models = require('app/models');
const Survey = models.survey;

const authenticate = require('./concerns/authenticate');

const index = (req, res, next) => {
  Survey.find({ _author: req.currentUser._id })
    .then(surveys => res.json({ surveys }))
    .catch(err => next(err));
};

const show = (req, res, next) => {
  Survey.findById(req.params.id)
    .then(survey => survey ? res.json({ survey }) : next())
    .catch(err => next(err));
};

const create = (req, res, next) => {
  let survey = Object.assign(req.body.survey, {
    _author: req.currentUser._id,
  });
  Survey.create(survey)
    .then(survey => res.json({ survey }))
    .catch(err => next(err));
};

const update = (req, res, next) => {
  let search = { _id: req.params.id, _author: req.currentUser._id };
  Survey.findOne(search)
    .then(survey => {
      if (!survey) {
        return next();
      }

      delete req.body._author;  // disallow owner reassignment.
      return survey.update(req.body.survey)
        .then(() => res.sendStatus(200));
    })
    .catch(err => next(err));
};

const respond = (req, res, next) => {
  let search = { _id: req.params.id };
  Survey.findOne(search)
    .then(survey => {
      if (!survey) {
        return next();
      }
      let responseOptions = survey.options;
      responseOptions[req.body.index].votes += 1;
      let updatedSurvey = { "survey": {} };
      updatedSurvey.options = responseOptions;
      updatedSurvey.options.sort(function (a,b) {
        if (a.votes < b.votes){
          return 1;
        }else if (a.votes > b.votes){
          return -1;
        }
        return 0;
      });
      return survey.update(updatedSurvey)
        .then(() => res.sendStatus(200));
    })
    .catch(err => next(err));
};



const destroy = (req, res, next) => {
  let search = { _id: req.params.id, _author: req.currentUser._id };
  Survey.findOne(search)
    .then(survey => {
      if (!survey) {
        return next();
      }

      return survey.remove()
        .then(() => res.sendStatus(200));
    })
    .catch(err => next(err));
};

module.exports = controller({
  index,
  show,
  create,
  update,
  respond,
  destroy,
}, { before: [
  { method: authenticate, except: ['show', 'respond'] },
], });

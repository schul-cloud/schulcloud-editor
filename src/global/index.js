/* eslint-disable no-param-reassign */
const { GeneralError, Forbidden } = require('@feathersjs/errors');
const logger = require('../logger');

const forceOperation = (context) => {
	const { force } = context.params.query;
	context.params.force = force === context.app.get('forceKey');
	delete context.params.query.force;
	return context;
};

const addUserId = (context) => {
	const { userId } = context.params;
	if (userId) {
		// todo validate mongoose id
		context.params.user = userId.toString();
	} else if (context.params.force) {
		context.params.user = '_isForceWithoutUser_';
	} else {
		throw new Forbidden('Can not resolve user information.');
	}
	return context;
};

/**
 * For errors without error code create server error with code 500.
 * In production mode remove error stack and data.
 * @param {context} ctx
 */
const errorHandler = (ctx) => {
	if (ctx.error) {
		if (ctx.error.hook) {
			delete ctx.error.hook;
		}
		logger.error(ctx.error);
		if (!ctx.error.code) {
			ctx.error = new GeneralError('server error', ctx.error);
		}

		// logger.warning(ctx.error);

		if (process.env.NODE_ENV === 'production') {
			ctx.error.stack = null;
			ctx.error.data = undefined;
		}
		return ctx;
	}
	logger.warning('Error with no error key is throw. Error logic can not handle it.');

	throw new GeneralError('server error');
};

exports.before = {
	all: [forceOperation, addUserId],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.error = {
	all: [errorHandler],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

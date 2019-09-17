const service = require('feathers-mongoose');
const { disallow } = require('feathers-hooks-common');

const { SyncGroupModel } = require('./models/');
const { addCourseId } = require('./hooks/');

const hooks = {};
hooks.before = {
	all: [disallow('external')],
	create: [addCourseId],
};

const SyncGroupModelService = (app) => {
	const option = {
		Model: SyncGroupModel,
		lean: true,
		paginate: {
			default: 50,
			max: 150,
		},
	};
	app.use('models/syncGroup', service(option));
	const syncGroupModelService = app.service('models/syncGroup');
	syncGroupModelService.hooks(hooks);
};

module.exports = {
	SyncGroupModelService,
	hooks,
};
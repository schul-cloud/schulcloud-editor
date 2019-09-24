const lessons = require('./lessons');
const groups = require('./groups');
const syncGroups = require('./syncGroups');
const sections = require('./sections');
const viewports = require('./viewports');
const permissionsHelper = require('./permissionsHelper');
// Events

module.exports = function setup(app) {
	/** first configure all services */
	app.configure(lessons);
	app.configure(groups);
	app.configure(syncGroups);
	app.configure(sections);
	app.configure(viewports);

	app.configure(permissionsHelper.bind({
		modelService: 'models/LessonModel',
		baseService: 'course/:courseId/lessons',
		doNotProtect: ['create'],
	}));
	app.configure(permissionsHelper.bind({
		modelService: 'models/SectionModel',
		baseService: 'lesson/:lessonId/sections',
		doNotProtect: ['create'],
	}));
	app.configure(permissionsHelper.bind({ baseService: 'viewports' }));

	/** then configure all event listener */
};

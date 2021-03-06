/* eslint-disable max-len */
const chai = require('chai');

const app = require('../../app');
const { TestHelper } = require('../../testHelpers');

const pathVisible = 'helpers/setVisibility';

const { expect } = chai;

describe('helperServices/visible.service.js', () => {
	let editor;
	let helper;
	let visibleService;

	before((done) => {
		editor = app.listen(app.get('port'), done);
	});

	before(() => {
		helper = new TestHelper(app);
		helper.defaultServiceSetup();

		helper.registerServiceHelper({
			serviceName: pathVisible,
		});
		visibleService = app.serviceHelper(pathVisible);
	});

	after(async () => {
		await helper.cleanup();
		await editor.close();
	});

	it('section patch without permission should not work', async () => {
		const { sectionId } = await helper.createTestData({ readIsActivated: false });

		const patchOptions = {
			id: sectionId,
			userId: helper.createObjectId(),
			data: { visible: true, type: 'section' },
		};

		const { status, data } = await visibleService.sendRequestToThisService('patch', patchOptions);
		expect(status, 'should return forbidden').to.equal(403);
		expect(data.message, 'should return the right error message from services').to.equal(visibleService.service.err.noAccess);
	});

	it('lesson patch without permission should not work', async () => {
		const { lessonId } = await helper.createTestData({ readIsActivated: false });

		const patchOptions = {
			id: lessonId,
			userId: helper.createObjectId(),
			data: { visible: true, type: 'lesson' },
		};

		const { status, data } = await visibleService.sendRequestToThisService('patch', patchOptions);
		expect(status, 'should return forbidden').to.equal(403);
		expect(data.message, 'should return the right error message from services').to.equal(visibleService.service.err.noAccess);
	});

	it('lesson patch with read permission should not work', async () => {
		const { lessonId, readUserId } = await helper.createTestData({ readIsActivated: false });

		const patchOptions = {
			id: lessonId,
			userId: readUserId,
			data: { visible: true, type: 'lesson' },
		};

		const { status, data } = await visibleService.sendRequestToThisService('patch', patchOptions);
		expect(status, 'should return forbidden').to.equal(403);
		expect(data.message, 'should return the right error message from services').to.equal(visibleService.service.err.noAccess);
	});

	it('by lesson request test only lesson permission, if user has to access reject it', async () => {
		const { lessonId, writeUserId } = await helper.createTestData({
			lessonPermission: ['read'], // permission for write user it not added
			readIsActivated: false,
		});

		const patchOptions = {
			id: lessonId,
			userId: writeUserId,
			data: { visible: true, type: 'lesson' },
		};

		const { status, data } = await visibleService.sendRequestToThisService('patch', patchOptions);
		expect(status, 'should return forbidden').to.equal(403);
		expect(data.message, 'should return the right error message from services').to.equal(visibleService.service.err.noAccess);
	});

	it('section patch should work', async () => {
		const { section, writeUserId } = await helper.createTestData({ readIsActivated: false });

		const patchOptions = {
			id: section._id,
			userId: writeUserId,
			data: { visible: true, type: 'section' },
		};

		const {
			status: statusTrue, data: dataTrue,
		} = await visibleService.sendRequestToThisService('patch', patchOptions);

		expect(statusTrue).to.equal(200);
		expect(dataTrue.visible, 'should visible set to true').to.be.true;

		patchOptions.data.visible = false;

		const {
			status: statusFalse, data: dataFalse,
		} = await visibleService.sendRequestToThisService('patch', patchOptions);

		expect(statusFalse).to.equal(200);
		expect(dataFalse.visible, 'should visible set to false').to.be.false;
	});

	it('lesson patch with childs should work', async () => {
		const { sectionId, lesson, writeUserId } = await helper.createTestData({ readIsActivated: false });
		// data.child default is true
		const patchOptions = {
			id: lesson._id,
			userId: writeUserId,
			data: { visible: true, type: 'lesson' },
		};

		const {
			status: statusTrue, data: dataTrue,
		} = await visibleService.sendRequestToThisService('patch', patchOptions);

		expect(statusTrue).to.equal(200);
		expect(dataTrue.visible, 'should visible set to true').to.be.true;
		expect(dataTrue.sections, 'test if section is added').to.be.an('array').to.has.lengthOf(1);

		const trueSection = dataTrue.sections[0];
		expect(trueSection._id.toString(), 'should be the right section').to.equal(sectionId);
		expect(trueSection.visible, 'should visible set to true').to.be.true;

		patchOptions.data.visible = false;

		const {
			status: statusFalse, data: dataFalse,
		} = await visibleService.sendRequestToThisService('patch', patchOptions);

		expect(statusFalse).to.equal(200);
		expect(dataFalse.visible, 'should visible set to false').to.be.false;
		expect(dataFalse.sections, 'test if section is added').to.be.an('array').to.has.lengthOf(1);

		const falseSection = dataFalse.sections[0];
		expect(falseSection.visible, 'should visible set to false').to.be.false;
		expect(falseSection._id.toString(), 'should be the right section').to.equal(sectionId);
	});

	it('services should work for lessons and sections without read permissions', async () => {
		const { lessonId, writeUserId } = await helper.createTestData({
			sectionPermission: ['write'],
			lessonPermission: ['write'],
			readIsActivated: false,
		});

		const patchOptions = {
			id: lessonId,
			userId: writeUserId,
			data: { visible: true, type: 'lesson' },
		};

		const { status, data } = await visibleService.sendRequestToThisService('patch', patchOptions);
		expect(status).to.equal(200);
		expect(data.type).to.be.exist;
		expect(data.sections).to.be.an('array').to.has.lengthOf(1);
		expect(Object.keys(data.sections[0]).length, 'should include an empty object').to.equal(0);
	});

	// lesson permission vorhanden + section teilweise nicht
	let lessonId;
	let testWriteUserId;
	before(async () => {
		({ lessonId, writeUserId: testWriteUserId } = await helper.createTestData({ readIsActivated: false }));
	});

	it('update should not allowed', async () => {
		const patchOptions = {
			id: lessonId,
			userId: testWriteUserId,
		};
		const { status, data } = await visibleService.sendRequestToThisService('update', patchOptions);
		expect(status).to.equal(405);
		expect(data.className).to.equal('method-not-allowed');
	});

	it('create should not allowed', async () => {
		const patchOptions = {
			userId: testWriteUserId,
		};
		const { status, data } = await visibleService.sendRequestToThisService('create', patchOptions);
		expect(status).to.equal(405);
		expect(data.className).to.equal('method-not-allowed');
	});

	it('get should not allowed', async () => {
		const patchOptions = {
			id: lessonId,
			userId: testWriteUserId,
		};
		const { status, data } = await visibleService.sendRequestToThisService('get', patchOptions);
		expect(status).to.equal(405);
		expect(data.className).to.equal('method-not-allowed');
	});

	it('find should not allowed', async () => {
		const patchOptions = {
			userId: testWriteUserId,
		};
		const { status, data } = await visibleService.sendRequestToThisService('find', patchOptions);
		expect(status).to.equal(405);
		expect(data.className).to.equal('method-not-allowed');
	});

	it('remove should not allowed', async () => {
		const patchOptions = {
			userId: testWriteUserId,
		};
		const { status, data } = await visibleService.sendRequestToThisService('remove', patchOptions);
		expect(status).to.equal(405);
		expect(data.className).to.equal('method-not-allowed');
	});
});

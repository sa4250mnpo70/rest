/*
 * Copyright 2012-2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail;

	assert = buster.assertions.assert;
	refute = buster.assertions.refute;
	fail = buster.assertions.fail;

	define('rest/dojo/RestStore-test', function (require) {

		var RestStore, SimpleRestStore, when;

		RestStore = require('rest/dojo/RestStore');
		SimpleRestStore = require('rest/dojo/SimpleRestStore');
		when = require('when');

		function client(request) {
			return when({
				request: request
			});
		}

		buster.testCase('rest/dojo/RestStore', {
			'should use "id" as the default idProperty': function () {
				var store = new RestStore();
				assert.equals('id', store.idProperty);
				assert.equals(42, store.getIdentity({ id: 42 }));
			},
			'should work with custom idProperty': function () {
				var store = new RestStore({ idProperty: 'key'});
				assert.equals('key', store.idProperty);
				assert.equals(42, store.getIdentity({ key: 42 }));
			},
			'should apply query params to the query string': function (done) {
				var store = new RestStore({ client: client });
				store.query({ q: 'what is the meaning of life?' }).then(function (response) {
					assert.equals('what is the meaning of life?', response.request.params.q);
				}).otherwise(fail).ensure(done);
			},
			'should get based on the id': function (done) {
				var store = new RestStore({ client: client });
				store.get(42).then(function (response) {
					assert.equals('42', response.request.path);
					refute(response.request.method);
				}).otherwise(fail).ensure(done);
			},
			'should remove based on the id': function (done) {
				var store = new RestStore({ client: client });
				store.remove(42).then(function (response) {
					assert.equals('42', response.request.path);
					assert.equals('delete', response.request.method);
				}).otherwise(fail).ensure(done);
			},
			'should add a record without an ID': function (done) {
				var store = new RestStore({ client: client });
				store.add({ foo: 'bar' }).then(function (response) {
					assert.equals('', response.request.path);
					assert.equals('post', response.request.method);
					assert.equals('*', response.request.headers['If-None-Match']);
					assert.equals('bar', response.request.entity.foo);
				}).otherwise(fail).ensure(done);
			},
			'should add a record with an explicit ID': function (done) {
				var store = new RestStore({ client: client });
				store.add({ foo: 'bar' }, { id: 42 }).then(function (response) {
					assert.equals('42', response.request.path);
					assert.equals('put', response.request.method);
					assert.equals('*', response.request.headers['If-None-Match']);
					assert.equals('bar', response.request.entity.foo);
					refute.equals('42', response.request.entity.id);
				}).otherwise(fail).ensure(done);
			},
			'should add a record with an implicit ID': function (done) {
				var store = new RestStore({ client: client });
				store.add({ foo: 'bar', id: 42 }).then(function (response) {
					assert.equals('42', response.request.path);
					assert.equals('put', response.request.method);
					assert.equals('*', response.request.headers['If-None-Match']);
					assert.equals('bar', response.request.entity.foo);
					assert.equals('42', response.request.entity.id);
				}).otherwise(fail).ensure(done);
			},
			'should add a record ignoring the ID': function (done) {
				var store = new RestStore({ client: client, ignoreId: true });
				store.add({ foo: 'bar', id: 42 }).then(function (response) {
					assert.equals('', response.request.path);
					assert.equals('post', response.request.method);
					assert.equals('*', response.request.headers['If-None-Match']);
					assert.equals('bar', response.request.entity.foo);
					assert.equals('42', response.request.entity.id);
				}).otherwise(fail).ensure(done);
			},
			'should put overwriting target': function (done) {
				var store = new RestStore({ client: client });
				store.put({ foo: 'bar', id: 42 }, { overwrite: true }).then(function (response) {
					assert.equals('42', response.request.path);
					assert.equals('put', response.request.method);
					assert.equals('*', response.request.headers['If-Match']);
				}).otherwise(fail).ensure(done);
			},
			'should put without overwriting target': function (done) {
				var store = new RestStore({ client: client });
				store.put({ foo: 'bar', id: 42 }, { overwrite: false }).then(function (response) {
					assert.equals('42', response.request.path);
					assert.equals('put', response.request.method);
					assert.equals('*', response.request.headers['If-None-Match']);
				}).otherwise(fail).ensure(done);
			},
			'should put with default config': function (done) {
				var store = new RestStore({ client: client });
				store.put({ foo: 'bar', id: 42 }).then(function (response) {
					assert.equals('42', response.request.path);
					assert.equals('put', response.request.method);
					refute(response.request.headers['If-None-Match']);
					refute(response.request.headers['If-Match']);
				}).otherwise(fail).ensure(done);
			},
			'should have a proper prototype chain': function () {
				assert(new RestStore() instanceof RestStore);
				assert(new RestStore() instanceof SimpleRestStore);
			}
		});

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));

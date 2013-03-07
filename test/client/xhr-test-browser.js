/*
 * Copyright (c) 2012-2013 VMware, Inc. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail, failOnThrow, undef;

	assert = buster.assertions.assert;
	refute = buster.assertions.refute;
	fail = buster.assertions.fail;
	failOnThrow = buster.assertions.failOnThrow;

	define('rest/client/xhr-test', function (require) {

		var xhr, rest, xhrFallback, when, client;

		xhr = require('rest/client/xhr');
		rest = require('rest');
		xhrFallback = require('rest/interceptor/ie/xhr');
		when = require('when');

		// use xhrFallback when XHR is not native
		client = !XMLHttpRequest ? xhr.chain(xhrFallback) : xhr;

		buster.testCase('rest/client/xhr', {
			'should make a GET by default': function (done) {
				var request = { path: '/' };
				client(request).then(function (response) {
					var xhr, name;
					xhr = response.raw;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'GET');
					assert.equals(xhr.responseText, response.entity);
					assert.equals(xhr.status, response.status.code);
					assert.equals(xhr.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(xhr.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).then(undef, fail).always(done);
			},
			'should make an explicit GET': function (done) {
				var request = { path: '/', method: 'GET' };
				client(request).then(function (response) {
					var xhr, name;
					xhr = response.raw;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'GET');
					assert.equals(xhr.responseText, response.entity);
					assert.equals(xhr.status, response.status.code);
					assert.equals(xhr.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(xhr.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).then(undef, fail).always(done);
			},
			'should make a POST with an entity': function (done) {
				var request = { path: '/', entity: 'hello world' };
				client(request).then(function (response) {
					var xhr, name;
					xhr = response.raw;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'POST');
					assert.equals(xhr.responseText, response.entity);
					assert.equals(xhr.status, response.status.code);
					assert.equals(xhr.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(xhr.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).then(undef, fail).always(done);
			},
			'should make an explicit POST with an entity': function (done) {
				var request = { path: '/', entity: 'hello world', method: 'POST' };
				client(request).then(function (response) {
					var xhr, name;
					xhr = response.raw;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'POST');
					assert.equals(xhr.responseText, response.entity);
					assert.equals(xhr.status, response.status.code);
					assert.equals(xhr.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(xhr.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).then(undef, fail).always(done);
			},
			'should abort the request if canceled': function (done) {
				// TDOO find an endpoint that takes a bit to respond, cached files may return synchronously
				var request = { path: '/wait/' + new Date().getTime() };
				when.all([
					client(request).then(
						fail,
						failOnThrow(function (response) {
							assert(request.canceled);
							try {
								// accessing 'status' will throw in older Firefox
								assert.same(0, response.raw.status);
							}
							catch (e) {
								// ignore
							}

							// this assertion is true in every browser except for IE 6
							// assert.same(XMLHttpRequest.UNSENT || 0, response.raw.readyState);
							assert(response.raw.readyState <= 3);
						})
					),
					when({}, function () {
						// push into when's nextTick resolution
						refute(request.canceled);
						request.cancel();
					})
				]).always(done);
			},
			'//should propogate request errors': function (done) {
				// TODO follow up with Sauce Labs
				// this test is valid, but fails with sauce as their proxy returns a 400
				var request = { path: 'http://localhost:1234' };
				client(request).then(
					fail,
					failOnThrow(function (response) {
						assert.same('loaderror', response.error);
					})
				).always(done);
			},
			'should not make a request that has already been canceled': function (done) {
				var request = { canceled: true, path: '/' };
				client(request).then(
					fail,
					failOnThrow(function (response) {
						assert.same(request, response.request);
						assert(request.canceled);
						assert.same('precanceled', response.error);
					})
				).always(done);
			},
			'should reject if an XHR impl is not available': {
				requiresSupportFor: { 'no-xhr': !window.XMLHttpRequest },
				'': function (done) {
					var request = { path: '/' };
					xhr(request).then(
						fail,
						failOnThrow(function (response) {
							assert.same(request, response.request);
							assert.same('xhr-not-available', response.error);
						})
					).always(done);
				}
			},
			'should be the default client': function () {
				assert.same(xhr, rest);
			},
			'should support interceptor chaining': function () {
				assert(typeof xhr.chain === 'function');
			}
		});
		// TODO spy XmlHttpRequest

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

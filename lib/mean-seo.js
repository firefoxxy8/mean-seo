'use strict';

/*!
 * MEAN - SEO
 * Ported from https://github.com/meanjs/mean-seo
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	browser = require('./browser'),
	Cache = require('./cache');

/**
 * Module default options
 */
var defaultOptions = {
	cacheClient: 'disk',
	cacheDuration: 2 * 60 * 60 * 24 * 1000,
	cacheFolder: __dirname + '/../tmp/mean-seo/cache'
};

/**
 * SEO:
 *
 * Renders static pages for crawlers
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
module.exports = function SEO(options) {
	//Initialize local variables
	var options = _.merge(defaultOptions, options || {});
	var cache = new Cache(options);

	return function SEO(req, res, next, cacheHit) {
		var escapedFragment = req.query._escaped_fragment_;

		//If the request came from a crawler
		if (escapedFragment !== undefined) {
			escapedFragment = escapedFragment.replace(/^[\/#!]+/,'');
			var url = req.protocol + '://' + req.get('host') + req.path + '#!/' + escapedFragment;

			cache.get(escapedFragment, function(err, page) {
				if (err) {
					//If not in cache crawl page
					browser.crawl(url, function(err, html) {
						if (err) {
							next(err);
						} else {
							//Save page to cache 
							cache.set(escapedFragment, html, function(err, res) {
								if (err) {
									next(err);
								}
							});

							//And output the result
							res.send(html);
							cacheHit && cacheHit();
						}
					});
				} else {
					//If page was found in cache, output the result					
					res.send(page.content);
					cacheHit && cacheHit();
				}
			});
		} else {
			next();
		}
	};
};

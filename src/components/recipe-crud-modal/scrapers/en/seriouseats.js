import request from 'request';
import { load } from 'cheerio';

import RecipeSchema from '../../helpers/recipe-schema';

const seriousEats = (url) => {
	const Recipe = new RecipeSchema();
	return new Promise((resolve, reject) => {
		if (!url.includes('seriouseats.com/')) {
			reject(new Error("url provided must include 'seriouseats.com/'"));
		} else {
			request(url, (error, response, html) => {
				if (!error && response.statusCode === 200) {
					const $ = load(html);

					if (url.includes('seriouseats.com/sponsored/')) {
						reject(
							new Error(
								'seriouseats.com sponsored recipes not supported'
							)
						);
					} else {
						regularRecipe($, Recipe);
					}

					if (
						!Recipe.name ||
						!Recipe.ingredients.length ||
						!Recipe.instructions.length
					) {
						reject(new Error('No recipe found on page'));
					} else {
						resolve(Recipe);
					}
				} else {
					reject(new Error('No recipe found on page'));
				}
			});
		}
	});
};

const regularRecipe = ($, Recipe) => {
	Recipe.image = $("meta[property='og:image']").attr('content');
	Recipe.name = $('.recipe-title').text().replace(/\s\s+/g, '');

	$('.ingredient').each((i, el) => {
		const item = $(el).text();
		Recipe.ingredients.push(item);
	});

	$('.recipe-about')
		.children('li')
		.each((i, el) => {
			const label = $(el).children('.label').text();
			const info = $(el).children('.info').text();

			if (label.includes('Active')) {
				Recipe.time.active = info;
			} else if (label.includes('Total')) {
				Recipe.time.total = info;
			} else if (label.includes('Yield')) {
				Recipe.servings = info.replace(/\D/g,'');
			}
		});

	$("li[class='label label-category top-level']").each((i, el) => {
		Recipe.tags.push($(el).find('a').text());
	});

	Recipe.tags = Recipe.tags.filter((item) => item);

	function onlyUnique(value, index, self) {
		return self.indexOf(value) === index;
	}

	Recipe.tags = Recipe.tags.filter(onlyUnique);

	$('.recipe-procedure-text').each((i, el) => {
		Recipe.instructions.push($(el).text().replace(/\s\s+/g, ''));
	});
};

export default seriousEats;

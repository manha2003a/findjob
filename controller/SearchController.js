import { Job } from '../model/Job';
import { JobController } from './JobController';

export class SearchController {
	static async searchVector(c) {
		const keyword = c.req.query('keyword') ?? '';
		const location = c.req.query('location') ?? '';
		const page = parseInt(c.req.query('page') || '1', 10);
		const limit = c.req.query('limit') ?? 10;
		const offset = page > 0 ? (page - 1) * limit : 0;
		var results = JSON.parse(await c.env.KV.get(keyword, { cacheTtl: 1800 }));
		if (results === null) {
			const esUrl = 'https://67263ea0658b4f0ba0ea6543031201c5.asia-southeast1.gcp.elastic-cloud.com:443/my_index_2/_search';
			const esAuth = 'ApiKey c2pBUEFKSUJ1T25meWlsZHBoU1Q6Y2RFY1RTRXVRay1FcEdsTXdINEpLUQ==';

			const description = await SearchController.embedding(keyword);
			const esQuery = {
				query: {
					script_score: {
						query: {},
						script: {
							source: "double cosineSim = cosineSimilarity(params.query_vector, 'description');return cosineSim",
							params: {
								query_vector: description,
							},
						},
						min_score: 0.4,
					},
				},
			};
			if (location) {
				esQuery.query.script_score.query.match = location;
			} else {
				esQuery.query.script_score.query.match_all = {};
			}
			const response = await (
				await fetch(esUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: esAuth,
					},
					body: JSON.stringify(esQuery),
				})
			).json();
			const ids = response.hits.hits.map((e) => e._source.id);
			results = await Job.getJobById(c, ids);
			await c.env.KV.put(keyword, JSON.stringify(results), {
				expirationTtl: 1800,
			});
		}
		var totalJobs = results.length;
		results = results.slice(offset, offset + limit);
		return c.json({
			success: true,
			data: results,
			pagination: {
				currentPage: page,
				totalItems: totalJobs,
				totalPages: Math.ceil(totalJobs / limit),
			},
		});
	}
	static async getSimilarJob(c) {
		const slug = c.req.query('slug');
		const esUrl = 'https://67263ea0658b4f0ba0ea6543031201c5.asia-southeast1.gcp.elastic-cloud.com:443/my_index_2/_search';
		const esAuth = 'ApiKey c2pBUEFKSUJ1T25meWlsZHBoU1Q6Y2RFY1RTRXVRay1FcEdsTXdINEpLUQ==';

		const job = await Job.getJob(c, slug);

		const description = await JobController.getVector(c, job.description);
		const esQuery = {
			query: {
				knn: {
					field: 'description',
					query_vector: description,
					k: 10,
					num_candidates: 1000,
				},
			},
		};
		const response = await (
			await fetch(esUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: esAuth,
				},
				body: JSON.stringify(esQuery),
			})
		).json();
		const ids = response.hits.hits.map((e) => e._source.id);
		const results = await Job.getJobById(c, ids);
		return c.json({
			success: true,
			data: results,
		});
	}
	static async embedding(text) {
		const embeddingResult = await (
			await fetch(
				'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=AIzaSyBqY9wCmeYNFQlZfJtMK12FTWjJvEo6-zQ',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						model: 'models/text-multilingual-embedding-002',
						content: {
							parts: [
								{
									text,
								},
							],
						},
					}),
				}
			)
		).json();
		const description = embeddingResult.embedding.values;
		return description;
	}
}

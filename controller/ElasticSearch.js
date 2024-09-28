export class ElasticSearch {
	static async getAllDoc(c) {
		const esUrl = 'https://67263ea0658b4f0ba0ea6543031201c5.asia-southeast1.gcp.elastic-cloud.com:443/my_index_2/_search';
		const esAuth = 'ApiKey c2pBUEFKSUJ1T25meWlsZHBoU1Q6Y2RFY1RTRXVRay1FcEdsTXdINEpLUQ==';
		const esQuery = {
			size: 10000,
			query: {
				match_all: {},
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
		return response.hits.hits;
	}
	static async deleteAllDoc(c) {
		var results = await ElasticSearch.getAllDoc(c);
		const ids = results.map((e) => e._id);
		for (var element of ids) {
			var esUrl = 'https://67263ea0658b4f0ba0ea6543031201c5.asia-southeast1.gcp.elastic-cloud.com:443/my_index_2/_doc/' + element;
			var esAuth = 'ApiKey c2pBUEFKSUJ1T25meWlsZHBoU1Q6Y2RFY1RTRXVRay1FcEdsTXdINEpLUQ==';
			var response = await (
				await fetch(esUrl, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: esAuth,
					},
				})
			).json();
			console.log(response);
			if (response.result === 'not_found') {
				return c.json("document doesn't exist", 400);
			}
		}
		return c.json('deleted all document', 200);
	}
}

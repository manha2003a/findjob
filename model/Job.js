export class Job {
	static async addJob(c, data) {
		const {
			title,
			description,
			location,
			experience,
			requirement,
			lower_bound,
			upper_bound,
			expiration_date,
			job_type,
			created_at,
			url,
			unit,
			slug,
			company_id,
		} = data;
		const query =
			'INSERT INTO Jobs (title, description, experience, requirement, location, url, lower_bound, upper_bound, expiration_date, job_type, created_at, unit, slug, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
		const result = await c.env.DB.prepare(query)
			.bind(
				title ?? '',
				description ?? '',
				experience ?? '',
				requirement ?? '',
				location ?? '',
				url ?? '',
				lower_bound ?? 0,
				upper_bound ?? 0,
				expiration_date ?? '',
				job_type ?? '',
				created_at ?? '',
				unit ?? '',
				slug ?? '',
				company_id ?? ''
			)
			.run();
		return result;
	}
	static async getListJob(c, limit, offset) {
		let { results } = await c.env.DB.prepare(`SELECT * FROM Jobs LIMIT ?1 OFFSET ?2`).bind(limit, offset).all();
		return results;
	}
	static async getJob(c, slug) {
		let { results } = await c.env.DB.prepare(`SELECT * FROM Jobs where slug = ?1`).bind(slug).all();
		return results;
	}
	static async totalJobs(c) {
		return await c.env.DB.prepare(`SELECT COUNT(*) as total_count FROM Jobs`).first('total_count');
	}
	static async getJobById(c, ids) {
		// Tạo câu lệnh truy vấn với IN
		ids = ids.filter((item) => typeof parseInt(item) === 'number' && !isNaN(item) && item);
		ids.map((item) => {
			return parseInt(item);
		});
		const placeholders = ids.map((e) => e).join(',');
		const sql = `SELECT * FROM Jobs WHERE id IN (${placeholders})`;
		// Thực thi truy vấn
		const { results } = await c.env.DB.prepare(sql).all();
		return results;
	}
}

import { Company } from '../model/Company';
import { Job } from '../model/Job';
import { createSlug } from '../utils/CreateSlug';
import { SearchController } from './SearchController';

export class JobController {
	static async getListJob(c) {
		const page = parseInt(c.req.query('page') || '1', 10);
		const limit = c.req.query('limit') ?? 10;
		const offset = page > 0 ? (page - 1) * limit : 0;
		try {
			const results = await Job.getListJob(c, limit, offset);
			const totalJobs = await Job.totalJobs(c);
			return c.json({
				success: true,
				data: results,
				pagination: {
					currentPage: page,
					totalItems: totalJobs,
					totalPages: Math.ceil(totalJobs / limit),
				},
			});
		} catch (error) {
			return c.json({ success: false, message: error.message }, 500);
		}
	}
	static async getJob(c) {
		const slug = c.req.param('slug');
		try {
			const result = await Job.getJob(c, slug);
			return c.json({
				success: true,
				data: result,
			});
		} catch (error) {
			return c.json({ success: false, message: error.message }, 500);
		}
	}
	static async addJob(c) {
		try {
			// Đọc thông tin từ request body
			const body = await c.req.json();
			// Ví dụ body có cấu trúc như sau: { "name": "John", "age": 30 }
			const { title, description, location, experience, requirement, salary, expiration_date, job_type, created_at, url, company } = body;
			const number = salary.match(/\d+/g);
			// lấy đơn vị tính
			var unit = '';
			const regex1 = /\b(usd)\b/i;
			const regex2 = /\b(triệu)\b/i;
			// lấy khoảng lương
			var lower_bound = 0;
			var upper_bound = 0;
			const regex3 = /^(tới)/;
			const regex4 = /^(trên)/;
			if (salary.match(regex1)) {
				unit = 'USD';
			} else if (salary.match(regex2)) {
				unit = 'triệu vnd';
			}
			if (salary.match(regex3)) {
				lower_bound = 0;
				upper_bound = number[0];
			} else if (salary.match(regex4)) {
				lower_bound = number[0];
				upper_bound = 0;
			} else if (number) {
				lower_bound = number[0];
				upper_bound = number[1];
			} else {
				lower_bound = 0;
				upper_bound = 0;
			}
			// Thực hiện lệnh SQL để lưu thông tin vào database
			const info_company = await Company.addCompany(c, company);
			const company_id = info_company.meta.last_row_id;
			const slug = createSlug(title);
			const info_job = await Job.addJob(c, {
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
			});
			await JobController.jobEmbedding(info_job.meta.last_row_id, description, location);
			return c.json({ message: 'saved successfully', status: 'success' }, 200);
		} catch (error) {
			console.error(error);
			return c.json({ message: error }, 500);
		}
	}
	static async jobEmbedding(id, text, location) {
		const esUrl = 'https://67263ea0658b4f0ba0ea6543031201c5.asia-southeast1.gcp.elastic-cloud.com:443/my_index_2/_doc';
		const esAuth = 'ApiKey c2pBUEFKSUJ1T25meWlsZHBoU1Q6Y2RFY1RTRXVRay1FcEdsTXdINEpLUQ=='; // Use your ES credentials
		const description = await SearchController.embedding(text);
		const esQuery = {
			description,
			id,
			location,
		};
		const response = await fetch(esUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: esAuth,
			},
			body: JSON.stringify(esQuery),
		});
		return true;
	}

	static async getVector(c, text) {
		const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
			text: text,
		});
		return embeddings.data[0];
	}
}

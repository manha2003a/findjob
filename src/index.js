import { Hono } from 'hono';
import index from '../views/index.html';
import detail from '../views/job-detail.html';
import { JobController } from '../controller/JobController';
import { CompanyController } from '../controller/CompanyController';
import { GetProvince } from '../utils/GetProvince';
import { SearchController } from '../controller/SearchController';
import { ElasticSearch } from '../controller/ElasticSearch';

const app = new Hono();

app.get('/', (c) => {
	return c.html(index);
});
app.get('/job-show/:slug', (c) => {
	return c.html(detail);
});

// api
app.get('/api/v1/job/:slug', JobController.getJob);
app.get('/jobs', JobController.getListJob);
app.get('/company', CompanyController.getCompanyWithId);
app.get('/api/v1/province', async (c) => {
	var listProvince = JSON.parse(await c.env.KV.get('list_province', { cacheTtl: 2592000 }));
	if (listProvince === null) {
		listProvince = await GetProvince();
		await c.env.KV.put('list_province', JSON.stringify(listProvince));
	}
	return c.json({
		status: 'success',
		data: listProvince,
	});
});
app.post('/add-job', JobController.addJob);
app.get('/search', SearchController.searchVector);
app.get('/similar-job', SearchController.searchVector);
app.delete('/delete-all', ElasticSearch.deleteAllDoc);
export default app;

const API = process.env.STAPI || 'http://localhost:1337';

module.exports =  {
  API,
  API_STRAPI: `${API}/api`,
  API_GRAPQL: `${API}/graphql`,
  BUCKET_NAME:  process.env.BUCKET_NAME,
  GCP_ENV: process.env.GCP_ENV,
  PROJECT_ID: process.env.PROJECT_ID,
};
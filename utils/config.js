const API = process.env.STAPI || 'http://localhost:1337';

module.exports =  {
  API,
  API_STRAPI: `${API}/api`,
  API_GRAPQL: `${API}/graphql`
};
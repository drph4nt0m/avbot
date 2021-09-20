const logger = require('../utils/Logger');
const Mongo = require('../utils/Mongo');

module.exports = {
  init(axios) {
    axios.interceptors.request.use((request) => {
      try {
        const hostname = new URL(request.baseURL).hostname;
        Mongo.increaseAPIUsage(hostname);
      } catch (error) {
        logger.error(`[*] ${error}`);
      }
      return request;
    });
    return axios;
  }
};

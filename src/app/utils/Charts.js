const axios = require('axios').default;
const logger = require('./Logger');

module.exports = class Chart {
  static api = axios.create({
    baseURL: 'https://charts.avbot.in/',
    timeout: 10000
  });

  static getChartURL(icao) {
    return `https://charts.avbot.in/${icao}.pdf`;
  }

  static getChart(icao) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.api.get(`${icao}.pdf`)
        resolve(this.getChartURL(icao));
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(error);
      }
    });
  }
};

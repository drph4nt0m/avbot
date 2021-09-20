const axios = require('axios').default;
const logger = require('./Logger');
const AxiosInterceptor = require('../interceptors/AxiosInterceptor');

module.exports = class AirportData {
  static api = AxiosInterceptor.init(
    axios.create({
      baseURL: 'https://www.airport-data.com/api/ac_thumb.json',
      timeout: 10000,
      params: {
        n: 'N'
      }
    })
  );

  static getAircraftImage(icao24) {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.api.get(null, {
          params: {
            m: icao24
          }
        });

        if (data.data.length > 0) {
          resolve(data.data[Math.floor(Math.random() * data.data.length)]);
        }
        reject(new Error(`no aircraft available at the moment with icao24 ${icao24}`));
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(`no aircraft available at the moment with icao24 ${icao24}`));
      }
    });
  }
};

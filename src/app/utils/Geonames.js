const axios = require('axios').default;
const services = require('../../config/services');
const logger = require('./Logger');
const AxiosInterceptor = require('../interceptors/AxiosInterceptor');

module.exports = class Geonames {
  static api = AxiosInterceptor.init(
    axios.create({
      baseURL: 'http://api.geonames.org/',
      timeout: 10000
    })
  );

  static async getTimezone(lat, long) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(`/timezoneJSON?formatted=true&username=${services.geonames.username}&lat=${lat}&lng=${long}&style=full`);

        if (response.status !== 200) {
          reject(new Error(`cannot retrieve timezone information`));
        }

        resolve(response.data);
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(error.message || `internal server error`));
      }
    });
  }

  static async getCoordinates(location) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(`/searchJSON?formatted=true&username=${services.geonames.username}&q=${location}&maxRows=1`);

        if (response.status !== 200) {
          reject(new Error(`cannot retrieve location information`));
        }

        if (response.data.geonames.length === 0) {
          reject(new Error(`could not find the location ${location}`));
        }

        resolve({ latitude: response.data.geonames[0].lat, longitude: response.data.geonames[0].lng });
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(error.message || `internal server error`));
      }
    });
  }
};

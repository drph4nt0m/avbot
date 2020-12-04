const axios = require('axios').default;
const services = require('../../config/services');
const logger = require('./Logger');

module.exports = class AeroDataBox {
  static api = axios.create({
    baseURL: 'https://aerodatabox.p.rapidapi.com/aircrafts/',
    timeout: 10000,
    headers: {
      'x-rapidapi-key': services.aero_data_box.token
    }
  });

  static getAircraftInfo(icao24) {
    return new Promise(async (resolve, reject) => {
      if (!icao24) {
        reject(new Error(`no aircraft available at the moment with icao24 ${icao24}`));
      }
      try {
        const { data } = await this.api.get(`/icao24/${icao24}`);
        resolve(data);
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(`no aircraft available at the moment with icao24 ${icao24}`));
      }
    });
  }

  static getAircraftImage(reg) {
    return new Promise(async (resolve, reject) => {
      if (!reg) {
        reject(new Error(`no aircraft available at the moment with registration ${reg}`));
      }
      try {
        const { data } = await this.api.get(`/reg/${reg}/image/beta`);
        resolve(data);
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(`no aircraft available at the moment with registration ${reg}`));
      }
    });
  }
};

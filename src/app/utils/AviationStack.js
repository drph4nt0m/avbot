const axios = require('axios').default;
const services = require('../../config/services');
const logger = require('./Logger');


module.exports = class AviationStack {
  static api = axios.create({
    baseURL: 'http://api.aviationstack.com/v1/flights',
    timeout: 10000,
    params: {
      access_key: services.aviation_stack.token
    }
  });


  static getFlightInfo(callsign) {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.api.get(null, {
          params: {
            flight_icao: callsign,
            flight_status: 'active'
          }
        });

        if (data.data.length > 0) {
          resolve(data.data[0])
        }
        reject(new Error(`no aircraft available at the moment with call sign ${callsign}`));
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(`no aircraft available at the moment with call sign ${callsign}`));
      }
    });
  }
};

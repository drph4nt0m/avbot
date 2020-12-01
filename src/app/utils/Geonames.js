const axios = require('axios').default;

module.exports = class Geonames {
  static api = axios.create({
    baseURL: 'http://api.geonames.org/',
    timeout: 10000,
  });

  static async getTimezone(lat, long) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(
          `/timezoneJSON?formatted=true&lat=${lat}&lng=${long}&username=targaryen&style=full`
        );

        if (response.status !== 200)
          return reject(new Error(`cannot retrieve timezone information`));

        return resolve(response.data);
      } catch (error) {
        return reject(new Error(error.message || `internal server error`));
      }
    });
  }
};

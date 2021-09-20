const axios = require('axios').default;
const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
const logger = require('./Logger');
const AxiosInterceptor = require('../interceptors/AxiosInterceptor');

dayjs.extend(isBetween);

module.exports = class Nats {
  static api = AxiosInterceptor.init(
    axios.create({
      baseURL: 'https://api.flightplandatabase.com/nav/NATS',
      timeout: 10000
    })
  );

  static getAllTracks() {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.api.get(null);

        const filteredNats = data.filter((nat) => dayjs().isBetween(nat.validFrom, nat.validTo, 'minute', '[]'));

        if (filteredNats.length > 0) {
          resolve({ nats: filteredNats });
        }
        reject(new Error(`no NATs available at the moment`));
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(`no NATs available at the moment`));
      }
    });
  }

  static getTrackInformation(ident) {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.api.get(null);

        const filteredNats = data.filter((nat) => dayjs().isBetween(nat.validFrom, nat.validTo, 'minute', '[]')).filter((nat) => nat.ident === ident);

        if (filteredNats) {
          resolve({ nat: filteredNats[0] });
        }
        reject(new Error(`no NAT available at the moment with ident ${ident}`));
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(`no NAT available at the moment with ident ${ident}`));
      }
    });
  }
};

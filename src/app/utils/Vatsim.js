const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const S = require('string');
const axios = require('axios').default;
const logger = require('./Logger');
const AxiosInterceptor = require('../interceptors/AxiosInterceptor');

dayjs.extend(utc);

module.exports = class Vatsim {
  static api = AxiosInterceptor.init(
    axios.create({
      baseURL: 'https://data.vatsim.net/v3/vatsim-data.json',
      timeout: 10000
    })
  );

  static vatsim = {
    general: {},
    pilots: {},
    controllers: {},
    atis: {},
    servers: {},
    prefiles: {},
    facilities: {},
    ratings: {},
    pilot_ratings: {},
    clients: {}
  };

  static formatDate(date) {
    return dayjs(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${date.slice(8, 10)}:${date.slice(10, 12)}:${date.slice(12, 14)}Z`);
  }

  static async download() {
    if (this.vatsim.general.update && this.formatDate(this.vatsim.general.update).add(4, 'minute').isAfter(dayjs())) {
      return;
    }

    this.vatsim = { ...(await this.api.get(null)).data, clients: {} };

    this.vatsim.pilots.forEach((c) => {
      this.vatsim.clients[c.callsign] = {
        callSign: c.callsign || undefined,
        cid: c.cid || undefined,
        name: c.name || undefined,
        clientType: 'PILOT',
        frequency: c.frequency || undefined,
        latitude: c.latitude || undefined,
        longitude: c.longitude || undefined,
        altitude: `${c.altitude} ft`,
        groundSpeed: `${c.groundspeed} knots`,
        aircraft: c.flight_plan ? c.flight_plan.aircraft : undefined,
        cruisingSpeed: c.flight_plan ? c.flight_plan.cruise_tas : undefined,
        departureAerodrome: c.flight_plan ? c.flight_plan.departure : undefined,
        cruisingLevel: c.flight_plan ? c.flight_plan.altitude : undefined,
        destinationAerodrome: c.flight_plan ? c.flight_plan.arrival : undefined,
        server: c.server || undefined,
        transponderCode: c.transponder || undefined,
        facilityType: c.facility ? this.vatsim.facilities[c.facility] : undefined,
        visualRange: undefined,
        revision: c.flight_plan ? c.flight_plan.revision_id : undefined,
        flightRules: c.flight_plan ? c.flight_plan.flight_rules : undefined,
        departureTime: c.flight_plan
          ? c.flight_plan.deptime.length === 2
            ? `00:${c.flight_plan.deptime.substring(0, 2)}z`
            : c.flight_plan.deptime.length === 3
            ? `0${c.flight_plan.deptime.substring(0, 1)}:${c.flight_plan.deptime.substring(1, 3)}z`
            : `${c.flight_plan.deptime.substring(0, 2)}:${c.flight_plan.deptime.substring(2, 4)}z`
          : undefined,
        eet: c.flight_plan
          ? c.flight_plan.enroute_time.length === 2
            ? `00:${c.flight_plan.enroute_time.substring(0, 2)}`
            : c.flight_plan.enroute_time.length === 3
            ? `0${c.flight_plan.enroute_time.substring(0, 1)}:${c.flight_plan.enroute_time.substring(1, 3)}`
            : `${c.flight_plan.enroute_time.substring(0, 2)}:${c.flight_plan.enroute_time.substring(2, 4)}`
          : undefined,
        alternateAerodrome: c.flight_plan ? c.flight_plan.alternate : undefined,
        route: c.flight_plan ? c.flight_plan.route : undefined,
        atis: c.text_atis ? c.text_atis.join('\n') : undefined,
        connectionTime: c.logon_time || undefined,
        atcPilotRating: this.vatsim.pilot_ratings[c.pilot_rating] ? this.vatsim.pilot_ratings[c.pilot_rating].short_name : undefined,
        heading: `${c.heading}°`
      };
    });

    this.vatsim.controllers.forEach((c) => {
      this.vatsim.clients[c.callsign] = {
        callSign: c.callsign || undefined,
        cid: c.cid || undefined,
        name: c.name || undefined,
        clientType: 'ATC',
        frequency: c.frequency || undefined,
        latitude: c.latitude || undefined,
        longitude: c.longitude || undefined,
        altitude: undefined,
        groundSpeed: undefined,
        aircraft: c.flight_plan ? c.flight_plan.aircraft : undefined,
        cruisingSpeed: c.flight_plan ? c.flight_plan.cruise_tas : undefined,
        departureAerodrome: c.flight_plan ? c.flight_plan.departure : undefined,
        cruisingLevel: c.flight_plan ? c.flight_plan.altitude : undefined,
        destinationAerodrome: c.flight_plan ? c.flight_plan.arrival : undefined,
        server: c.server || undefined,
        transponderCode: c.transponder || undefined,
        facilityType: this.vatsim.facilities[c.facility].long,
        visualRange: c.visual_range ? `${c.visual_range} NM` : undefined,
        revision: c.flight_plan ? c.flight_plan.revision_id : undefined,
        flightRules: c.flight_plan ? c.flight_plan.flight_rules : undefined,
        departureTime: c.flight_plan
          ? c.flight_plan.deptime.length === 2
            ? `00:${c.flight_plan.deptime.substring(0, 2)}z`
            : c.flight_plan.deptime.length === 3
            ? `0${c.flight_plan.deptime.substring(0, 1)}:${c.flight_plan.deptime.substring(1, 3)}z`
            : `${c.flight_plan.deptime.substring(0, 2)}:${c.flight_plan.deptime.substring(2, 4)}z`
          : undefined,
        eet: c.flight_plan
          ? c.flight_plan.enroute_time.length === 2
            ? `00:${c.flight_plan.enroute_time.substring(0, 2)}`
            : c.flight_plan.enroute_time.length === 3
            ? `0${c.flight_plan.enroute_time.substring(0, 1)}:${c.flight_plan.enroute_time.substring(1, 3)}`
            : `${c.flight_plan.enroute_time.substring(0, 2)}:${c.flight_plan.enroute_time.substring(2, 4)}`
          : undefined,
        alternateAerodrome: c.flight_plan ? c.flight_plan.alternate : undefined,
        route: c.flight_plan ? c.flight_plan.route : undefined,
        atis: c.text_atis ? c.text_atis.join('\n') : undefined,
        connectionTime: c.logon_time || undefined,
        atcPilotRating: this.vatsim.ratings[c.rating].short || undefined,
        heading: undefined
      };
    });
  }

  static async getClientInfo(callSign) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.download();

        if (this.vatsim.clients[callSign]) {
          resolve({
            vatsimClient: this.vatsim.clients[callSign]
          });
        }
        reject(new Error(`no client available at the moment with call sign ${callSign}`));
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(error.response || `no client available at the moment with call sign ${callSign}`));
      }
    });
  }

  static async getPartialAtcClientInfo(partialCallSign) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.download();

        const atcList = [];

        Object.keys(this.vatsim.clients).forEach((callSign) => {
          if (this.vatsim.clients[callSign].clientType === 'ATC' && callSign.match(partialCallSign)) {
            atcList.push(this.vatsim.clients[callSign]);
          }
        });

        if (atcList.length > 0) {
          resolve({
            atcList
          });
        }
        reject(new Error(`no client available at the moment matching call sign ${partialCallSign}`));
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(error.response || `no client available at the moment matching call sign ${partialCallSign}`));
      }
    });
  }
};

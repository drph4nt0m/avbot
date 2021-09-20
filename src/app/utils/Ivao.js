const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const S = require('string');
const axios = require('axios').default;
const logger = require('./Logger');
const AxiosInterceptor = require('../interceptors/AxiosInterceptor');

dayjs.extend(utc);

module.exports = class Ivao {
  static api = AxiosInterceptor.init(
    axios.create({
      baseURL: 'https://api.ivao.aero/getdata/whazzup/whazzup.txt',
      timeout: 10000
    })
  );

  static facilityType = {
    0: 'Observer',
    1: 'Flight Information',
    2: 'Delivery',
    3: 'Ground',
    4: 'Tower',
    5: 'Approach',
    6: 'ACC',
    7: 'Departure'
  };

  static administrativeRating = {
    0: 'Suspended',
    1: 'Observer',
    2: 'User',
    11: 'Supervisor',
    12: 'Administrator'
  };

  static atcRating = {
    1: 'Observer',
    2: 'ATC Applicant (AS1)',
    3: 'ATC Trainee (AS2)',
    4: 'Advanced ATC Trainee (AS3)',
    5: 'Aerodrome Controller (ADC)',
    6: 'Approach Controller (APC)',
    7: 'Center Controller (ACC)',
    8: 'Senior Controller (SEC)',
    9: 'Senior ATC Instructor (SAI)',
    10: 'Chief ATC Instructor (CAI)'
  };

  static pilotRating = {
    1: 'Observer',
    2: 'Basic Flight Student (FS1)',
    3: 'Flight Student (FS2)',
    4: 'Advanced Flight Student (FS3)',
    5: 'Private Pilot (PP)',
    6: 'Senior Private Pilot (SPP)',
    7: 'Commercial Pilot (CP)',
    8: 'Airline Transport Pilot (ATP)',
    9: 'Senior Flight Instructor (SFI)',
    10: 'Chief Flight Instructor (CFI)'
  };

  static flightSimulators = {
    0: 'Unknown',
    1: 'Microsoft Flight Simulator 95',
    2: 'Microsoft Flight Simulator 98',
    3: 'Microsoft Combat Flight Simulator',
    4: 'Microsoft Flight Simulator 2000',
    5: 'Microsoft Combat Flight Simulator 2',
    6: 'Microsoft Flight Simulator 2002',
    7: 'Microsoft Combat Flight Simulator 3',
    8: 'Microsoft Flight Simulator 2004',
    9: 'Microsoft Flight Simulator X',
    11: 'X-Plane (unknown version)',
    12: 'X-Plane 8.x',
    13: 'X-Plane 9.x',
    14: 'X-Plane 10.x',
    15: 'PS1',
    16: 'X-Plane 11.x',
    17: 'X-Plane 12.x',
    20: 'Fly!',
    21: 'Fly! 2',
    25: 'FlightGear',
    30: 'Prepar3D 1.x',
    40: 'Microsoft Flight Simulator 2020'
  };

  static ivao = {
    general: {},
    clients: {},
    airports: {},
    servers: {}
  };

  static formatDate(date) {
    return dayjs(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${date.slice(8, 10)}:${date.slice(10, 12)}:${date.slice(12, 14)}Z`);
  }

  static async download() {
    if (this.ivao.general.UPDATE && this.formatDate(this.ivao.general.UPDATE).add(4, 'minute').isAfter(dayjs())) {
      return;
    }

    const [, general, clients, airports, servers] = (await this.api.get(null)).data
      .split(/!GENERAL|!CLIENTS|!AIRPORTS|!SERVERS/g)
      .map((r) => r.trim());

    general.split('\n').forEach((g) => {
      const t = g.split('=').map((r) => r.trim());
      this.ivao.general[S(t[0]).replaceAll(' ', '_').s] = t[1];
    });

    servers.split('\n').forEach((s) => {
      const t = s.split(':').map((r) => r.trim());
      this.ivao.servers[t[0]] = {
        ip: t[1],
        location: t[2],
        name: t[3],
        clientConnectionsAllowed: t[4],
        maximumConnection: t[5]
      };
    });

    airports.split('\n').forEach((a) => {
      const t = a.split(':').map((r) => r.trim());
      this.ivao.airports[t[0]] = {
        icao: t[0],
        atis: t[1]
      };
    });

    clients.split('\n').forEach((c) => {
      const t = c.split(':').map((r) => r.trim());
      this.ivao.clients[t[0]] = {
        callSign: t[0] || undefined,
        vid: t[1] || undefined,
        name: t[2] || undefined,
        clientType: t[3] || undefined,
        frequency: t[4] || undefined,
        latitude: t[5] || undefined,
        longitude: t[6] || undefined,
        altitude: t[7] ? `${t[7]} ft` : undefined || undefined,
        groundSpeed: t[8] ? `${t[8]} knots` : undefined || undefined,
        aircraft: t[9] || undefined,
        cruisingSpeed: t[10] || undefined,
        departureAerodrome: t[11] || undefined,
        cruisingLevel: t[12] || undefined,
        destinationAerodrome: t[13] || undefined,
        server: t[14] || undefined,
        protocol: t[15] || undefined,
        combinedRating: t[16] || undefined,
        transponderCode: t[17] || undefined,
        facilityType: t[18] ? this.facilityType[t[18]] : undefined || undefined,
        visualRange: t[19] ? `${t[19]} NM` : undefined || undefined,
        revision: t[20] || undefined,
        flightRules: t[21] || undefined,
        departureTime: t[22]
          ? t[22].length === 2
            ? `00:${t[22].substring(0, 2)}z`
            : t[22].length === 3
            ? `0${t[22].substring(0, 1)}:${t[22].substring(1, 3)}z`
            : `${t[22].substring(0, 2)}:${t[22].substring(2, 4)}z`
          : undefined || undefined,
        actualDepartureTime: t[23] || undefined,
        eetHours: t[24] ? (t[24].length === 1 ? `0${t[24]}` : t[24]) : undefined || undefined,
        eetMinutes: t[25] ? (t[25].length === 1 ? `0${t[25]}` : t[25]) : undefined || undefined,
        enduranceHours: t[26] ? (t[26].length === 1 ? `0${t[26]}` : t[26]) : undefined || undefined,
        enduranceMinutes: t[27] ? (t[27].length === 1 ? `0${t[27]}` : t[27]) : undefined || undefined,
        alternateAerodrome: t[28] || undefined,
        otherInfo: t[29] || undefined,
        route: t[30] || undefined,
        atis: S(t[35]).replaceAll('^�', ' ').s.replace(/\s+/g, ' ') || undefined,
        atisTime: t[36] ? this.formatDate(t[36]).toDate() : undefined || undefined,
        connectionTime: t[37] ? this.formatDate(t[37]).toDate() : undefined || undefined,
        softwareName: t[38] || undefined,
        softwareVersion: t[39] || undefined,
        administrativeVersion: t[40] || undefined,
        atcPilotRating: t[3] === 'ATC' ? this.atcRating[t[41]] : t[3] === 'PILOT' ? this.pilotRating[t[41]] : undefined || undefined,
        alternateAerodrome2: t[42] || undefined,
        typeOfFlight: t[43] || undefined,
        personsOnBoard: t[44] || undefined,
        heading: t[45] ? `${t[45]}°` : undefined || undefined,
        onGround: t[46] === '1' ? true : false || undefined,
        simulator: t[47] ? this.flightSimulators[t[47]] : undefined || undefined,
        plane: t[48] || undefined
      };
    });
  }

  static async getClientInfo(callSign) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.download();

        if (this.ivao.clients[callSign]) {
          resolve({
            ivaoClient: this.ivao.clients[callSign]
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

        Object.keys(this.ivao.clients).forEach((callSign) => {
          if (this.ivao.clients[callSign].clientType === 'ATC' && callSign.match(partialCallSign)) {
            atcList.push(this.ivao.clients[callSign]);
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

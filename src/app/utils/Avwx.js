const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const accents = require('remove-accents');
const axios = require('axios').default;
const services = require('../../config/services');
const logger = require('./Logger');

dayjs.extend(utc);

module.exports = class Avwx {
  static api = axios.create({
    baseURL: 'https://avwx.rest/api/',
    timeout: 10000,
    headers: {
      Authorization: services.avwx.token
    }
  });

  static async getStation(icao) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(`/station/${icao}`);

        if (response.status !== 200) {
          reject(new Error(`no station available at the moment near ${icao}`));
        }
        const station = response.data;

        resolve({
          station
        });
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(error.response.data.error || `no station available at the moment near ${icao}`));
      }
    });
  }

  static async getTaf(icao) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(`/taf/${icao}?options=info,translate,speech`);

        if (response.status !== 200) {
          reject(new Error(`no station available at the moment near ${icao}`));
        }
        const taf = response.data;

        let readable = '';
        readable += '**Station : ** ';

        if (taf.info.icao) {
          readable += `${taf.info.icao}`;
        } else {
          readable += `${taf.station}`;
        }

        let station = '';
        if (taf.info.name || taf.info.city) {
          if (taf.info.name) {
            try {
              station += `${accents.remove(taf.info.name)}`;
              if (taf.info.city) {
                try {
                  station += `, ${accents.remove(taf.info.city)}`;
                } catch (err) {
                  logger.error(`[x] ${err}`);
                }
              }
            } catch (error) {
              logger.error(`[x] ${error}`);
              if (taf.info.city) {
                try {
                  station += `${accents.remove(taf.info.city)}`;
                } catch (err) {
                  logger.error(`[x] ${err}`);
                }
              }
            }
          }
        }

        if (station) {
          readable += ` (${station})`;
        }

        readable += '\n';

        readable += `**Observed at : ** ${dayjs.utc(taf.time.dt).format('YYYY-MM-DD HH:mm:ss [Z]')} \n`;

        readable += `**Report : ** ${taf.speech}`;

        resolve({
          raw: taf.raw,
          readable,
          speech: taf.speech
        });
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(error.response.data.error || `no station available at the moment near ${icao}`));
      }
    });
  }

  static async getMetar(icao) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(`/metar/${icao}?options=info,translate,speech`);

        if (response.status !== 200) {
          reject(new Error(`no station available at the moment near ${icao}`));
        }
        const metar = response.data;
        let readable = '';
        readable += '**Station : ** ';

        if (metar.info.icao) {
          readable += `${metar.info.icao}`;
        } else {
          readable += `${metar.station}`;
        }

        let station = '';
        if (metar.info.name || metar.info.city) {
          if (metar.info.name) {
            try {
              station += `${accents.remove(metar.info.name)}`;
              if (metar.info.city) {
                try {
                  station += `, ${accents.remove(metar.info.city)}`;
                } catch (err) {
                  logger.error(`[x] ${err}`);
                }
              }
            } catch (error) {
              logger.error(`[x] ${error}`);
              if (metar.info.city) {
                try {
                  station += `${accents.remove(metar.info.city)}`;
                } catch (err) {
                  logger.error(`[x] ${err}`);
                }
              }
            }
          }
        }

        if (station) {
          readable += ` (${station})`;
        }

        readable += '\n';

        readable += `**Observed at : ** ${dayjs.utc(metar.time.dt).format('YYYY-MM-DD HH:mm:ss [Z]')} \n`;

        if (metar.translate.wind) {
          readable += `**Wind : ** ${metar.translate.wind} \n`;
        }

        if (metar.translate.visibility) {
          readable += `**Visibility : ** ${metar.translate.visibility} \n`;
        }

        if (metar.translate.temperature) {
          readable += `**Temperature : ** ${metar.translate.temperature} \n`;
        }

        if (metar.translate.dewpoint) {
          readable += `**Dew Point : ** ${metar.translate.dewpoint} \n`;
        }

        if (metar.translate.altimeter) {
          readable += `**Altimeter : ** ${metar.translate.altimeter} \n`;
        }

        if (metar.translate.clouds) {
          readable += `**Clouds : ** ${metar.translate.clouds} \n`;
        }

        if (metar.translate.other) {
          readable += `**Weather Phenomena : ** ${metar.translate.other}\n`;
        }

        if (metar.flight_rules) {
          readable += `**Flight Rules : ** ${metar.flight_rules}`;
        }

        resolve({
          raw: metar.raw,
          readable,
          speech: metar.speech
        });
      } catch (error) {
        logger.error(`[x] ${error}`);
        reject(new Error(error.response.data.error || `no station available at the moment near ${icao}`));
      }
    });
  }
};

const axios = require('axios').default;

const services = require('../../config/services');

module.exports = class AvBrief3 {
  static api = axios.create({
    baseURL: `https://avbrief3.el.r.appspot.com/api`,
    timeout: 10000,
    params: {
      key: services.avbrief3.token
    }
  });

  static async getAtis(icao) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(null, {
          params: {
            icao
          }
        });

        if (response.status !== 200 || !response.data || !response.data.a_text) {
          reject(new Error(`no atis available at the moment for ${icao}`));
        }

        resolve({
          speech: response.data.a_text
        });
      } catch (error) {
        reject(new Error(error.response.data.error || `no atis available at the moment for ${icao}`));
      }
    });
  }

  static async getMetar(icao) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(null, {
          params: {
            icao
          }
        });

        if (response.status !== 200 || !response.data || !response.data.m_text) {
          reject(new Error(`no station available at the moment near ${icao}`));
        }

        resolve({
          raw: response.data.m_text
        });
      } catch (error) {
        reject(new Error(error.response.data.error || `no station available at the moment near ${icao}`));
      }
    });
  }

  static async getTaf(icao) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.api.get(null, {
          params: {
            icao
          }
        });

        if (response.status !== 200 || !response.data || !response.data.t_text) {
          reject(new Error(`no station available at the moment near ${icao}`));
        }

        resolve({
          raw: response.data.t_text
        });
      } catch (error) {
        reject(new Error(error.response.data.error || `no station available at the moment near ${icao}`));
      }
    });
  }
};

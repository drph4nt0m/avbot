import type {Document} from "bson";

export type propTypes = envTypes;
export type envTypes = {
    AERO_DATA_BOX_TOKEN: string,
    AVBRIEF3_TOKEN: string,
    AVIATION_STACK_TOKEN: string,
    AVWX_TOKEN: string,
    BOT_OWNERS: string,
    BOT_RESTART_CHANNEL: string,
    DATADOG_API_KEY: string,
    DBL_TOKEN: string,
    DISCORD_APPLICATION_ID: string,
    DISCORD_PUBLIC_KEY: string,
    DISCORD_TOKEN: string,
    GEONAMES_USERNAME: string,
    LOG_WEBHOOK: string,
    MONGODB_URI: string,
    NEW_GUILDS_CHANNEL: string,
    NODE_ENV: string,
    PORT: string,
    SUPPORT_SERVER_INVITE: string
};

export type NODE_ENV = "production" | "development";

export type CommandCount = {
    counts: Document[],
    total: number
} | null;


export type IcaoCode = {
    "icao": string,
    "iata": string,
    "name": string,
    "city": string,
    "state": string,
    "country": string,
    "elevation": number,
    "lat": number,
    "lon": number,
    "fullInfo": string,
    "value": string,
    "tz": string
};

export type Station = {
    "city": string,
    "country": string,
    "elevation_ft": number,
    "elevation_m": number,
    "iata": string,
    "icao": string,
    "latitude": number,
    "longitude": number,
    "name": string,
    "note": string,
    "reporting": true,
    "runways": Runway[],
    "state": string,
    "type": string,
    "website": string,
    "wiki": string
};

export type Runway = {
    "length_ft": number,
    "width_ft": number,
    "ident1": string,
    "ident2": string
};

export type TafInfo = {
    raw: string,
    readable: string,
    speech: string
};

export type MetarInfo = TafInfo;


export type FlightInfo = {
    icao24: string,
    callsign: string,
    origin_country: string,
    time_position: string,
    last_contact: string,
    longitude: string,
    latitude: string,
    baro_altitude: string,
    on_ground: string,
    velocity: string,
    true_track: string,
    vertical_rate: string,
    sensors: string,
    geo_altitude: string,
    squawk: string,
    spi: string,
    position_source: string
};

type stackI = {
    airport: string,
    icao: string
};

export type AviationStackInfo = {
    departure: stackI
    arrival: stackI
};

export type AeroDataBoxInfo = {
    airlineName: string,
    typeName: string,
    reg: string
};

export type AircraftInfo = {
    "image": string,
    "link": string,
    "photographer": string
};

export type Nats = {
    ident: string,
    validFrom: string,
    validTo: string,
    route: {
        westLevels: string[],
        eastLevels: string[],
        nodes: NatsNode[]
    }
};

export type NatsNode = {
    "id": number,
    "ident": string,
    "type": string,
    "lat": number,
    "lon": number
};

export type IvaoInfo = {
    updatedAt: Date;
    servers: IvaoServer[];
    voiceServers: IvaoServer[];
    clients: IvaoClients;
    connections: IvaoConnections;
};

export type IvaoClients = {
    pilots: IvaoPilot[];
    atcs: IvaoAtc[];
    followMe: any[];
    observers: IvaoAtc[];
};

export type IvaoAtc = {
    time: number;
    id: number;
    userId: number;
    callsign: string;
    serverId: string;
    softwareTypeId: string;
    softwareVersion: string;
    rating: number;
    createdAt: Date;
    lastTrack: IvaoLastTrack;
    atcSession: IvaoAtcSession;
};

export type IvaoAtcSession = {
    frequency: number;
    position: null | string;
};

export type IvaoLastTrack = {
    altitude: number;
    altitudeDifference: number;
    arrivalDistance: number | null;
    departureDistance: number | null;
    groundSpeed: number;
    heading: number;
    latitude: number;
    longitude: number;
    onGround: boolean;
    state: null | string;
    timestamp: Date;
    transponder: number;
    transponderMode: string;
    time: number;
};

export type IvaoPilot = {
    time: number;
    id: number;
    userId: number;
    callsign: string;
    serverId: string;
    softwareTypeId: string;
    softwareVersion: string;
    rating: number;
    createdAt: Date;
    lastTrack: IvaoLastTrack;
    flightPlan: IvaoFlightPlan;
    pilotSession: IvaoPilotSession;
};

export type IvaoFlightPlan = {
    id: number;
    revision: number;
    aircraftId: string;
    aircraftNumber: number;
    departureId: string;
    arrivalId: string;
    alternativeId: null;
    alternative2Id: null;
    route: string;
    remarks: string;
    speed: string;
    level: string;
    flightRules: string;
    flightType: string;
    eet: number;
    endurance: number;
    departureTime: number;
    actualDepartureTime: number;
    peopleOnBoard: number;
    createdAt: Date;
    updatedAt: Date;
    aircraftEquipments: string;
    aircraftTransponderTypes: string;
    aircraft: IvaoAircraft;
};

export type IvaoAircraft = {
    icaoCode: string;
    model: string;
    wakeTurbulence: string;
    isMilitary: boolean;
    description: string;
};

export type IvaoPilotSession = {
    simulatorId: string;
};

export type IvaoConnections = {
    total: number;
    supervisor: number;
    atc: number;
    observer: number;
    pilot: number;
    worldTour: number;
};

export type IvaoServer = {
    id: string;
    hostname: string;
    ip: string;
    description: string;
    countryId: string;
    currentConnections: number;
    maximumConnections: number;
};


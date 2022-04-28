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
    id: string;
    ident: string;
    type: string;
    name: string;
    latitude_deg: number;
    longitude_deg: number;
    elevation_ft: number;
    continent: string;
    iso_country: string;
    iso_region: string;
    municipality: string;
    scheduled_service: string;
    gps_code: string;
    iata_code: string;
    local_code: string;
    home_link: string;
    wikipedia_link: string;
    keywords: string,
    value: string,
    fullInfo: string
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

export type IvaoAtis = {
    lines: string[];
    callsign: string;
    revision: string;
    timestamp: Date;
    sessionId: number;
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
    atis: IvaoAtis;
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


export enum IvaoAtcRatingEnum {
    "Observer" = 1,
    "ATC Applicant (AS1)" = 2,
    "ATC Trainee (AS2)" = 3,
    "Advanced ATC Trainee (AS3)" = 4,
    "Aerodrome Controller (ADC)" = 5,
    "Approach Controller (APC)" = 6,
    "Center Controller (ACC)" = 7,
    "Senior Controller (SEC)" = 8,
    "Senior ATC Instructor (SAI)" = 9,
    "Chief ATC Instructor (CAI)" = 10
}

export enum IvaoPilotRatingEnum {
    "Observer" = 1,
    "Basic Flight Student (FS1)" = 2,
    "Flight Student (FS2)" = 3,
    "Advanced Flight Student (FS3)" = 4,
    "Private Pilot (PP)" = 5,
    "Senior Private Pilot (SPP)" = 6,
    "Commercial Pilot (CP)" = 7,
    "Airline Transport Pilot (ATP)" = 8,
    "Senior Flight Instructor (SFI)" = 9,
    "Chief Flight Instructor (CFI)" = 10
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


export type VatsimInfo = {
    general: VatsimGeneral;
    pilots: VatsimPilot[];
    controllers: VatsimAtc[];
    atis: VatsimAtis[];
    servers: VatsimServerElement[];
    prefiles: VatsimPrefile[];
    facilities: VatsimFacility[];
    ratings: VatsimFacility[];
    pilot_ratings: VatsimPilotRating[];
};

export type VatsimAtc = VatsimAtis;

export type VatsimAtis = {
    cid: number;
    name: string;
    callsign: string;
    frequency: string;
    facility: number;
    rating: number;
    server: VatsimServerEnum;
    visual_range: number;
    atis_code?: null | string;
    text_atis: string[] | null;
    last_updated: Date;
    logon_time: Date;
};


export enum VatsimServerEnum {
    Amsterdam = "AMSTERDAM",
    Canada = "CANADA",
    Germany = "GERMANY",
    Singapore = "SINGAPORE",
    Uk = "UK",
    UsaEast = "USA-EAST",
    UsaWest = "USA-WEST",
}

export type VatsimFacility = {
    id: number;
    short: string;
    long: string;
};

export type VatsimGeneral = {
    version: number;
    reload: number;
    update: string;
    update_timestamp: Date;
    connected_clients: number;
    unique_users: number;
};

export type VatsimPilotRating = {
    id: number;
    short_name: string;
    long_name: string;
};

export type VatsimPilot = {
    cid: number;
    name: string;
    callsign: string;
    server: VatsimServerEnum;
    pilot_rating: number;
    latitude: number;
    longitude: number;
    altitude: number;
    groundspeed: number;
    transponder: string;
    heading: number;
    qnh_i_hg: number;
    qnh_mb: number;
    flight_plan: VatsimFlightPlan | null;
    logon_time: Date;
    last_updated: Date;
};

export type VatsimFlightPlan = {
    flight_rules: VatsimFlightRules;
    aircraft: string;
    aircraft_faa: string;
    aircraft_short: string;
    departure: string;
    arrival: string;
    alternate: string;
    cruise_tas: string;
    altitude: string;
    deptime: string;
    enroute_time: string;
    fuel_time: string;
    remarks: string;
    route: string;
    revision_id: number;
    assigned_transponder: string;
};

export enum VatsimFlightRules {
    I = "I",
    V = "V",
}

export type VatsimPrefile = {
    cid: number;
    name: string;
    callsign: string;
    flight_plan: VatsimFlightPlan;
    last_updated: Date;
};

export type VatsimServerElement = {
    ident: VatsimServerEnum;
    hostname_or_ip: string;
    location: string;
    name: VatsimServerEnum;
    clients_connection_allowed: number;
    client_connections_allowed: boolean;
    is_sweatbox: boolean;
};

export type FlightSimNetwork = "Ivao" | "Vatsim";

/**
 * Shape of the SL Transport API response
 * (GET /v1/sites/{site}/departures), as synced into /data/sl.json.
 * Fields we don't rely on are optional so a partial payload still renders.
 */
export interface SlDeparturesResponse {
  departures: DepartureMetadata[];
  stop_deviations?: StopDeviation[];
}

export interface Deviation {
  importance_level?: number;
  consequence?: string;
  message?: string;
}

export interface StopDeviation extends Deviation {
  id?: number;
  scope?: {
    stop_areas?: { id: number; name: string }[];
    stop_points?: { id: number; name: string; designation?: string }[];
    lines?: { id: number; designation: string }[];
  };
}

export interface DepartureMetadata {
  destination: string;
  direction?: string;
  direction_code?: number;
  via?: string;
  state: string;
  display: string;
  scheduled: string;
  expected?: string;
  journey: {
    id: number | string;
    state?: string;
    prediction_state?: string;
  };
  stop_area?: {
    id: number;
    name: string;
    type?: string;
  };
  stop_point?: {
    id: number;
    name: string;
    designation?: string;
  };
  line: {
    id?: number;
    designation: string;
    transport_mode?: string;
    group_of_lines?: string;
  };
  deviations?: Deviation[];
}

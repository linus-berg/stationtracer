import { useQuery } from '@tanstack/react-query';
import { config } from '../config';
import { parseDepartures } from '../lib/departures';
import { DataFileError, fetchDataFile } from '../lib/fetchData';
import { parseForecast } from '../lib/smhi';
import { WEEKDAYS, type RestaurantMenu } from '../types/RestaurantMenu';

const common = {
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

export const useDepartures = () =>
  useQuery({
    ...common,
    queryKey: ['departures'],
    queryFn: () => fetchDataFile(config.dataUrls.departures, parseDepartures),
    refetchInterval: config.refreshMs.departures,
  });

export const useForecast = () =>
  useQuery({
    ...common,
    queryKey: ['weather'],
    queryFn: () => fetchDataFile(config.dataUrls.weather, parseForecast),
    refetchInterval: config.refreshMs.weather,
  });

function parseMenu(raw: unknown): RestaurantMenu {
  if (typeof raw !== 'object' || raw === null || !WEEKDAYS.some((d) => d in raw)) {
    throw new DataFileError("The menu file doesn't list any weekdays.");
  }
  const menu = raw as Partial<RestaurantMenu>;
  const result = {} as RestaurantMenu;
  for (const day of WEEKDAYS) {
    result[day] = [...(Array.isArray(menu[day]) ? menu[day]! : [])]
      .filter((d) => d && typeof d.dish === 'string' && d.dish.trim())
      .map((d) => ({ ...d, type: d.type ?? 'standard' }))
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }
  return result;
}

export const useMenu = () =>
  useQuery({
    ...common,
    queryKey: ['menu'],
    queryFn: () => fetchDataFile(config.dataUrls.menu, parseMenu),
    refetchInterval: config.refreshMs.menu,
  });

declare module "ephemeris" {
  export function getAllPlanets(
    date: Date,
    longitude: number,
    latitude: number,
    height: number,
  ): {
    observed: Record<
      string,
      {
        apparentLongitudeDd: number;
        raw?: {
          position?: {
            is_retrograde?: boolean;
          };
        };
      }
    >;
  };
}


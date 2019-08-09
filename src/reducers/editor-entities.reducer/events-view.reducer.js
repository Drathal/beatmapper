import undoable, { includeAction, groupByActionTypes } from 'redux-undo';
import produce from 'immer';

import { flatten } from '../../utils';

const initialState = {
  tracks: {
    laserLeft: [],
    laserRight: [],
    laserBack: [],
    primaryLight: [],
    trackNeons: [],
    largeRing: [],
    smallRing: [],
    laserSpeedLeft: [],
    laserSpeedRight: [],
  },
};

const LIGHTING_TRACKS = [
  'laserLeft',
  'laserRight',
  'laserBack',
  'primaryLight',
  'trackNeons',
];

const LASER_SPEED_TRACKS = ['laserSpeedLeft', 'laserSpeedRight'];

const events = (state = initialState, action) => {
  switch (action.type) {
    case 'CREATE_NEW_SONG':
    case 'CLEAR_ENTITIES': {
      return initialState;
    }

    case 'LOAD_BEATMAP_ENTITIES': {
      // Entities are loaded all in 1 big array, since that's how they're saved
      // to disk. Reduce them into a map based on trackId
      if (!action.events || action.events.length === 0) {
        return state;
      }

      const tracks = action.events.reduce((acc, event) => {
        acc[event.trackId].push(event);
        return acc;
      }, initialState.tracks);

      return {
        ...state,
        tracks,
      };
    }

    case 'PLACE_EVENT': {
      const {
        id,
        trackId,
        beatNum,
        eventType,
        eventColor,
        eventLaserSpeed,
      } = action;

      const newEvent = {
        id,
        trackId,
        beatNum,
        type: eventType,
      };

      if (LIGHTING_TRACKS.includes(trackId)) {
        newEvent.color = eventColor;
      } else if (LASER_SPEED_TRACKS.includes(trackId)) {
        newEvent.laserSpeed = eventLaserSpeed;
      }

      return {
        ...state,
        tracks: {
          ...state.tracks,
          [trackId]: [...state.tracks[trackId], newEvent],
        },
      };
    }

    default:
      return state;
  }
};

//
//
//// SELECTORS
//
const getTracks = state => state.editorEntities.eventsView.tracks;

export const getEventsForTrack = (state, trackId) => {
  const tracks = getTracks(state);
  return tracks[trackId];
};

export const getAllEventsAsArray = state => {
  const tracks = getTracks(state);
  return flatten(Object.values(tracks));
};

export default events;

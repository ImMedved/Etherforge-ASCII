import { ELEMENTS } from '../config.js';

export function createCampaignProgression() {
  return {
    spheres: Object.fromEntries(Object.values(ELEMENTS).map((element) => [element.id, 0])),
    storyFlags: {},
    completedMissions: [],
    currentHubId: 'coastal-outpost',
    gearScore: 0
  };
}

export function normalizeCampaignProgression(value = {}) {
  const base = createCampaignProgression();
  return {
    ...base,
    ...value,
    spheres: { ...base.spheres, ...(value.spheres || {}) },
    storyFlags: { ...(value.storyFlags || {}) },
    completedMissions: Array.isArray(value.completedMissions) ? [...value.completedMissions] : []
  };
}

export function grantSphere(progression, elementId, maximum = 5) {
  if (!Object.hasOwn(progression.spheres, elementId)) return false;
  progression.spheres[elementId] = Math.min(maximum, progression.spheres[elementId] + 1);
  return true;
}

export function markStoryFlag(progression, flag, value = true) {
  progression.storyFlags[flag] = value;
}

export function completeMission(progression, missionId) {
  if (!progression.completedMissions.includes(missionId)) {
    progression.completedMissions.push(missionId);
  }
}

export function progressionSummary(progression) {
  return {
    spherePower: Object.values(progression.spheres).reduce((sum, value) => sum + value, 0),
    gearScore: progression.gearScore,
    completedMissions: progression.completedMissions.length
  };
}

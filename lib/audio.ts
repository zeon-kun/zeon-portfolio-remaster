// Shared audio state — accessed by AudioPlayer (writes) and GlobeBlueprint (reads)
// Uses plain refs so the globe's rAF loop can read without triggering React renders

export const audioState = {
  analyser: null as AnalyserNode | null,
  dataArray: null as Uint8Array | null,
  isPlaying: false,
};

/**
 * Read current frequency data and return normalized bands (0–1).
 * Call this every animation frame from the globe.
 */
export function getFrequencyBands(): {
  bass: number;
  mid: number;
  treble: number;
} {
  const { analyser, dataArray } = audioState;
  if (!analyser || !dataArray) {
    return { bass: 0, mid: 0, treble: 0 };
  }

  analyser.getByteFrequencyData(dataArray);

  const len = dataArray.length; // fftSize/2 = 128 bins
  const bassEnd = Math.floor(len * 0.3);
  const midEnd = Math.floor(len * 0.6);

  let bassSum = 0;
  let midSum = 0;
  let trebleSum = 0;

  for (let i = 0; i < len; i++) {
    if (i < bassEnd) bassSum += dataArray[i];
    else if (i < midEnd) midSum += dataArray[i];
    else trebleSum += dataArray[i];
  }

  const bassCount = bassEnd;
  const midCount = midEnd - bassEnd;
  const trebleCount = len - midEnd;

  return {
    bass: bassCount > 0 ? bassSum / (bassCount * 255) : 0,
    mid: midCount > 0 ? midSum / (midCount * 255) : 0,
    treble: trebleCount > 0 ? trebleSum / (trebleCount * 255) : 0,
  };
}

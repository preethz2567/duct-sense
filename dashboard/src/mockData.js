// src/mockData.js
// Mock walkthrough data matching the shape used by storage/report_generator.py
// Each event: { position_m: float, leak_confidence: float, timestamp: float }

export const mockWalkthroughs = [
  {
    walkthrough_id: "a1b2c3d4-0001-4e5f-8a9b-c0d1e2f30001",
    date: "2026-09-18",
    leak_events: [
      { position_m: 1.119, leak_confidence: 0.68, timestamp: 16.5 },
      { position_m: 1.153, leak_confidence: 0.74, timestamp: 17.0 },
      { position_m: 1.186, leak_confidence: 0.81, timestamp: 17.5 },
      { position_m: 1.220, leak_confidence: 0.77, timestamp: 18.0 },
      { position_m: 1.254, leak_confidence: 0.74, timestamp: 18.5 },
      { position_m: 1.288, leak_confidence: 0.68, timestamp: 19.0 },
    ],
  },
  {
    walkthrough_id: "b2c3d4e5-0002-4f6a-9b0c-d1e2f3a40002",
    date: "2026-09-19",
    leak_events: [
      { position_m: 0.542, leak_confidence: 0.71, timestamp: 8.0  },
      { position_m: 0.576, leak_confidence: 0.79, timestamp: 8.5  },
      { position_m: 0.610, leak_confidence: 0.83, timestamp: 9.0  },
      { position_m: 0.644, leak_confidence: 0.76, timestamp: 9.5  },
    ],
  },
  {
    walkthrough_id: "c3d4e5f6-0003-4a7b-0c1d-e2f3a4b50003",
    date: "2026-09-20",
    leak_events: [],   // clean walkthrough — no leaks detected
  },
];

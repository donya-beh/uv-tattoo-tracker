const { getUVCategory, getTattooRecommendation, fetchUVData } = require("../app.js");
const { vi } = require("vitest");

// ── getUVCategory boundary tests ──────────────────────────────────────────────

describe("getUVCategory", () => {
  test("UV 0 → Low", () => {
    expect(getUVCategory(0).label).toBe("Low");
  });

  test("UV 2 → Low (upper boundary)", () => {
    expect(getUVCategory(2).label).toBe("Low");
  });

  test("UV 3 → Moderate (lower boundary)", () => {
    expect(getUVCategory(3).label).toBe("Moderate");
  });

  test("UV 5 → Moderate (upper boundary)", () => {
    expect(getUVCategory(5).label).toBe("Moderate");
  });

  test("UV 6 → High (lower boundary)", () => {
    expect(getUVCategory(6).label).toBe("High");
  });

  test("UV 7 → High (upper boundary)", () => {
    expect(getUVCategory(7).label).toBe("High");
  });

  test("UV 8 → Very High (lower boundary)", () => {
    expect(getUVCategory(8).label).toBe("Very High");
  });

  test("UV 10 → Very High (upper boundary)", () => {
    expect(getUVCategory(10).label).toBe("Very High");
  });

  test("UV 11 → Extreme", () => {
    expect(getUVCategory(11).label).toBe("Extreme");
  });

  test("returns a color for each category", () => {
    [0, 2, 3, 5, 6, 7, 8, 10, 11].forEach((uv) => {
      const { color } = getUVCategory(uv);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

// ── getTattooRecommendation boundary tests ────────────────────────────────────

describe("getTattooRecommendation", () => {
  test("UV 2 → safe message", () => {
    expect(getTattooRecommendation(2)).toBe(
      "UV is low — safe to go outside without covering your tattoo."
    );
  });

  test("UV 3 → cover message", () => {
    expect(getTattooRecommendation(3)).toBe(
      "UV is moderate to extreme — cover your tattoo before going outside."
    );
  });

  test("UV 0 → safe message", () => {
    expect(getTattooRecommendation(0)).toBe(
      "UV is low — safe to go outside without covering your tattoo."
    );
  });

  test("UV 11 → cover message", () => {
    expect(getTattooRecommendation(11)).toBe(
      "UV is moderate to extreme — cover your tattoo before going outside."
    );
  });
});

// ── fetchUVData tests ─────────────────────────────────────────────────────────

describe("fetchUVData", () => {
  const mockHourly = {
    time: ["2024-06-01T00:00", "2024-06-01T01:00"],
    uv_index: [0.0, 0.5],
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns hourly data and timezone on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ timezone: "Europe/London", hourly: mockHourly }),
    });

    const result = await fetchUVData(51.5, -0.1, "Europe/London");
    expect(result.hourly).toEqual(mockHourly);
    expect(result.timezone).toBe("Europe/London");
  });

  test("calls the correct URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ timezone: "Europe/London", hourly: mockHourly }),
    });

    await fetchUVData(51.5, -0.1, "Europe/London");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("api.open-meteo.com/v1/forecast")
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("latitude=51.5")
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("hourly=uv_index")
    );
  });

  test("throws UV_DATA_UNAVAILABLE when hourly is missing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ timezone: "Europe/London" }),
    });

    await expect(fetchUVData(51.5, -0.1, "Europe/London")).rejects.toMatchObject({
      type: "UV_DATA_UNAVAILABLE",
    });
  });

  test("throws UV_API_ERROR on non-ok HTTP response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    await expect(fetchUVData(51.5, -0.1, "Europe/London")).rejects.toMatchObject({
      type: "UV_API_ERROR",
    });
  });

  test("throws UV_API_ERROR on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchUVData(51.5, -0.1, "Europe/London")).rejects.toMatchObject({
      type: "UV_API_ERROR",
    });
  });
});

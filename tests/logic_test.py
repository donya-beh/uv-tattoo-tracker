"""
Pure-logic tests for UV Tattoo Tracker (Python port of tests/logic.test.js).
Mirrors the boundary tests specified in Task 3.
Run with: python3 -m pytest tests/logic_test.py -v
       or: python3 tests/logic_test.py
"""

import math
import re
import unittest

# ── Pure logic ported from app.js ────────────────────────────────────────────

UV_CATEGORIES = [
    {"max": 2,          "label": "Low",       "color": "#4caf50"},
    {"max": 5,          "label": "Moderate",  "color": "#ffeb3b"},
    {"max": 7,          "label": "High",      "color": "#ff9800"},
    {"max": 10,         "label": "Very High", "color": "#f44336"},
    {"max": math.inf,   "label": "Extreme",   "color": "#9c27b0"},
]


def get_uv_category(uv_index):
    for cat in UV_CATEGORIES:
        if uv_index <= cat["max"]:
            return {"label": cat["label"], "color": cat["color"]}
    raise ValueError(f"No category for UV index {uv_index}")


def get_tattoo_recommendation(uv_index):
    if uv_index <= 2:
        return "UV is low — safe to go outside without covering your tattoo."
    return "UV is moderate to extreme — cover your tattoo before going outside."


ERROR_MESSAGES = {
    "LOCATION_NOT_FOUND":  "Location not found. Please try a different search.",
    "GEOCODING_ERROR":     "Unable to resolve location. Please try again.",
    "UV_API_ERROR":        "Unable to retrieve UV data. Please try again.",
    "UV_DATA_UNAVAILABLE": "Hourly UV data is not available for this location.",
    "AUTO_REFRESH_FAILED": "Auto-refresh failed. Showing last known data.",
}


def handle_error_message(error_type):
    """Returns the user-facing message for a given error type (pure logic, no DOM)."""
    return ERROR_MESSAGES.get(error_type, "An unexpected error occurred.")


def handle_error_is_inline(error_type):
    """Returns True if the error should be shown as an inline notice (not in #error-banner)."""
    return error_type == "AUTO_REFRESH_FAILED"


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestGetUVCategory(unittest.TestCase):

    def test_uv_0_is_low(self):
        self.assertEqual(get_uv_category(0)["label"], "Low")

    def test_uv_2_is_low_upper_boundary(self):
        self.assertEqual(get_uv_category(2)["label"], "Low")

    def test_uv_3_is_moderate_lower_boundary(self):
        self.assertEqual(get_uv_category(3)["label"], "Moderate")

    def test_uv_5_is_moderate_upper_boundary(self):
        self.assertEqual(get_uv_category(5)["label"], "Moderate")

    def test_uv_6_is_high_lower_boundary(self):
        self.assertEqual(get_uv_category(6)["label"], "High")

    def test_uv_7_is_high_upper_boundary(self):
        self.assertEqual(get_uv_category(7)["label"], "High")

    def test_uv_8_is_very_high_lower_boundary(self):
        self.assertEqual(get_uv_category(8)["label"], "Very High")

    def test_uv_10_is_very_high_upper_boundary(self):
        self.assertEqual(get_uv_category(10)["label"], "Very High")

    def test_uv_11_is_extreme(self):
        self.assertEqual(get_uv_category(11)["label"], "Extreme")

    def test_returns_hex_color_for_all_boundaries(self):
        hex_re = re.compile(r'^#[0-9a-fA-F]{6}$')
        for uv in [0, 2, 3, 5, 6, 7, 8, 10, 11]:
            color = get_uv_category(uv)["color"]
            self.assertRegex(color, hex_re, f"UV {uv} color '{color}' is not a valid hex color")


class TestGetTattooRecommendation(unittest.TestCase):

    SAFE_MSG  = "UV is low — safe to go outside without covering your tattoo."
    COVER_MSG = "UV is moderate to extreme — cover your tattoo before going outside."

    def test_uv_0_safe(self):
        self.assertEqual(get_tattoo_recommendation(0), self.SAFE_MSG)

    def test_uv_2_safe_upper_boundary(self):
        self.assertEqual(get_tattoo_recommendation(2), self.SAFE_MSG)

    def test_uv_3_cover_lower_boundary(self):
        self.assertEqual(get_tattoo_recommendation(3), self.COVER_MSG)

    def test_uv_11_cover(self):
        self.assertEqual(get_tattoo_recommendation(11), self.COVER_MSG)


class TestHandleError(unittest.TestCase):

    def test_location_not_found_message(self):
        self.assertEqual(
            handle_error_message("LOCATION_NOT_FOUND"),
            "Location not found. Please try a different search.",
        )

    def test_geocoding_error_message(self):
        self.assertEqual(
            handle_error_message("GEOCODING_ERROR"),
            "Unable to resolve location. Please try again.",
        )

    def test_uv_api_error_message(self):
        self.assertEqual(
            handle_error_message("UV_API_ERROR"),
            "Unable to retrieve UV data. Please try again.",
        )

    def test_uv_data_unavailable_message(self):
        self.assertEqual(
            handle_error_message("UV_DATA_UNAVAILABLE"),
            "Hourly UV data is not available for this location.",
        )

    def test_auto_refresh_failed_message(self):
        self.assertEqual(
            handle_error_message("AUTO_REFRESH_FAILED"),
            "Auto-refresh failed. Showing last known data.",
        )

    def test_unknown_type_returns_fallback(self):
        self.assertEqual(
            handle_error_message("UNKNOWN_TYPE"),
            "An unexpected error occurred.",
        )

    def test_auto_refresh_is_inline_notice(self):
        self.assertTrue(handle_error_is_inline("AUTO_REFRESH_FAILED"))

    def test_other_errors_use_banner(self):
        for t in ["LOCATION_NOT_FOUND", "GEOCODING_ERROR", "UV_API_ERROR", "UV_DATA_UNAVAILABLE"]:
            self.assertFalse(handle_error_is_inline(t), f"{t} should use #error-banner")


if __name__ == "__main__":
    unittest.main(verbosity=2)

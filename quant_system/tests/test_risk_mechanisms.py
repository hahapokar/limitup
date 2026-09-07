import sys
import types
import unittest
from unittest.mock import patch

from quant_system.core.data_fetcher import DataFetcher, data_fetcher
from quant_system.core.scoring import ScoringEngine


class RiskMechanismTests(unittest.TestCase):
    def setUp(self):
        self.engine = ScoringEngine()
        self.stock = {
            "code": "600001",
            "price": 10.0,
            "float_market_cap": 2e9,
            "turnover_rate": 10.0,
            "seal_ratio": 0.5,
            "consecutive_boards": 1,
            "sector": "test",
            "is_st": False,
            "institution_ratio": 0.1,
        }
        self.sectors = {
            "test": {
                "count": 1,
                "is_solo_zone": True,
                "has_true_resonance": False,
                "is_overcrowded": False,
            }
        }

    def test_board_decay_at_five_and_six(self):
        for boards, expected in ((5, 1.0), (6, 0.7)):
            stock = dict(self.stock, consecutive_boards=boards)
            result = self.engine._compute_factor_scores(
                [stock], self.sectors, "震荡/分化期", boards
            )[0]
            self.assertEqual(
                result["factor_breakdown"]["consecutive_board_sentiment"]["decay_factor"],
                expected,
            )

    def test_three_percent_high_risk_release_is_kept_and_penalized(self):
        lockup = {
            "available": True,
            "records": {
                "600001": {
                    "risk_ratio": 0.03,
                    "release_date": "2026-09-08",
                    "release_type": "定向增发",
                    "ratio_basis": "float",
                }
            },
        }
        with patch.object(data_fetcher, "get_lockup_risk_map", return_value=lockup):
            passed, stats = self.engine._apply_hard_filters([dict(self.stock)], "2026-09-07")
        self.assertEqual(len(passed), 1)
        self.assertEqual(stats["lockup_warning"], 1)
        self.assertEqual(passed[0]["lockup_risk_penalty"], 15.0)

        scored = self.engine._compute_factor_scores([passed[0]], self.sectors, "震荡/分化期", 1)[0]
        self.assertEqual(scored["quant_score"], max(0.0, scored["original_quant_score"] - 15.0))

    def test_six_percent_high_risk_release_is_excluded(self):
        lockup = {"available": True, "records": {"600001": {
            "risk_ratio": 0.06,
            "release_date": "2026-09-08",
            "release_type": "股权激励",
            "ratio_basis": "float",
        }}}
        with patch.object(data_fetcher, "get_lockup_risk_map", return_value=lockup):
            passed, stats = self.engine._apply_hard_filters([dict(self.stock)], "2026-09-07")
        self.assertEqual(passed, [])
        self.assertEqual(stats["lockup_hard_excluded"], 1)

    def test_no_release_passes(self):
        with patch.object(data_fetcher, "get_lockup_risk_map", return_value={"available": True, "records": {}}):
            passed, _ = self.engine._apply_hard_filters([dict(self.stock)], "2026-09-07")
        self.assertEqual(len(passed), 1)
        self.assertEqual(passed[0]["lockup_risk_penalty"], 0.0)

    def test_unavailable_data_fails_open(self):
        with patch.object(data_fetcher, "get_lockup_risk_map", return_value={"available": False, "records": {}}):
            passed, stats = self.engine._apply_hard_filters([dict(self.stock)], "2026-09-07")
        self.assertEqual(len(passed), 1)
        self.assertEqual(stats["lockup_data_unavailable"], 1)
        self.assertFalse(passed[0]["lockup_data_available"])

    def test_historical_date_anchors_window_and_uses_cache(self):
        class FakeFrame:
            def to_dict(self, orient="records"):
                return [
                    {"股票代码": "600001", "解禁日期": "2026-09-25", "解禁类型": "定向增发", "占流通股比例": "3%"},
                    {"股票代码": "600002", "解禁日期": "2026-09-28", "解禁类型": "定向增发", "占流通股比例": "3%"},
                ]

        calls = []
        fake_akshare = types.SimpleNamespace(
            stock_restricted_release_queue_em=lambda: calls.append(True) or FakeFrame()
        )
        fetcher = DataFetcher()
        with patch.dict(sys.modules, {"akshare": fake_akshare}):
            first = fetcher.get_lockup_risk_map("2026-09-07")
            second = fetcher.get_lockup_risk_map("2026-09-07")
        self.assertEqual(len(calls), 1)
        self.assertIs(first, second)
        self.assertIn("600001", first["records"])
        self.assertNotIn("600002", first["records"])


if __name__ == "__main__":
    unittest.main()

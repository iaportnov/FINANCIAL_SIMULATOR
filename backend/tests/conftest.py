# Shared pytest fixtures.
#
# Unit tests for core logic (grading, progression/XP) need no database — see
# test_grading.py.
#
# DB-backed integration tests should run against a real Postgres test database
# with a transaction rollback per test (per the testing ADR). Add that fixture
# here — e.g. spin up Postgres via testcontainers, create the schema, and yield
# an AsyncSession bound to a transaction that is rolled back after each test —
# when writing the first integration test.

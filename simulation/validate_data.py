import argparse

from simulation.adapters.starter_data import validate_starter_data


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Epic 2 starter datasets")
    parser.add_argument("data_directory", nargs="?", default=".")
    args = parser.parse_args()

    report = validate_starter_data(args.data_directory)
    print(f"Files checked: {report.files_checked}")
    for filename, row_count in report.rows_checked.items():
        print(f"  {filename}: {row_count} rows")
    for warning in report.warnings:
        print(f"WARNING: {warning}")
    for error in report.errors:
        print(f"ERROR: {error}")
    print("Starter data validation: " + ("PASS" if report.valid else "FAIL"))
    return 0 if report.valid else 1


if __name__ == "__main__":
    raise SystemExit(main())

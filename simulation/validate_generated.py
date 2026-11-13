import argparse

from simulation.validation import validate_generated_operation


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate generated operation data")
    parser.add_argument("data_directory", nargs="?", default="simulation/datasets/generated")
    args = parser.parse_args()

    report = validate_generated_operation(args.data_directory)
    print(f"Files checked: {report.files_checked}")
    for filename, row_count in report.rows_checked.items():
        print(f"  {filename}: {row_count} rows")
    for warning in report.warnings:
        print(f"WARNING: {warning}")
    for error in report.errors:
        print(f"ERROR: {error}")
    print("Generated data validation: " + ("PASS" if report.valid else "FAIL"))
    return 0 if report.valid else 1


if __name__ == "__main__":
    raise SystemExit(main())

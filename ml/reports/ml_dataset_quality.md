# AI-04 ML Dataset Quality Report

Status: **PASS**

| Dataset | Rows |
|---|---:|
| Historical deliveries | 450 |
| Prediction snapshots | 1800 |

## Warnings

- Split 'development' does not contain both on-time and late labels
- Split 'validation' does not contain both on-time and late labels

## Errors

- None

The dataset is split by complete simulation exercise. Delivery snapshots from one exercise must not be distributed across train, validation, or test splits.

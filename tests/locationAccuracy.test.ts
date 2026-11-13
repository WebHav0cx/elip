import assert from "node:assert/strict";
import test from "node:test";
import { assessLocation, locationAccuracyBounds } from "../src/features/movement/services/locationAccuracy.ts";

const coordinates = { latitude: 9.0765, longitude: 7.3986, accuracy: 15 };

test("rejects the reported 540 km fix instead of plotting it", () => {
  const fix = assessLocation({ ...coordinates, accuracy: 539871 });
  assert.equal(fix.usable, false);
  assert.match(fix.message, /too approximate.*540 km/);
  assert.equal("position" in fix, false);
});

test("accepts a subsequent precise fix without changing its reported accuracy", () => {
  const fix = assessLocation(coordinates);
  assert.equal(fix.usable, true);
  if (fix.usable) {
    assert.deepEqual(fix.position, [9.0765, 7.3986]);
    assert.equal(fix.accuracy, 15);
    assert.match(fix.message, /accuracy ±15 m/);
  }
});

test("labels approximate fixes and applies the 1 km cutoff", () => {
  assert.match(assessLocation({ ...coordinates, accuracy: 800 }).message, /^Approximate location/);
  assert.equal(assessLocation({ ...coordinates, accuracy: 1000 }).usable, true);
  assert.equal(assessLocation({ ...coordinates, accuracy: 1001 }).usable, false);
});

test("rejects invalid readings", () => {
  for (const accuracy of [NaN, Infinity, -1]) assert.equal(assessLocation({ ...coordinates, accuracy }).usable, false);
  assert.equal(assessLocation({ ...coordinates, latitude: NaN }).usable, false);
  assert.equal(assessLocation({ ...coordinates, longitude: 181 }).usable, false);
});

test("fits wider reported uncertainty without collapsing for zero accuracy", () => {
  const point: [number, number] = [9.0765, 7.3986];
  const precise = locationAccuracyBounds(point, 15);
  const approximate = locationAccuracyBounds(point, 800);
  assert.ok(precise[0][0] < point[0] && precise[1][0] > point[0]);
  assert.ok(approximate[0][0] < precise[0][0] && approximate[1][1] > precise[1][1]);
  assert.ok(locationAccuracyBounds(point, 0)[1][0] > point[0]);
});

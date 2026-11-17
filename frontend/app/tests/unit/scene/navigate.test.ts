import { assertEquals } from '@std/assert';
import { arrowSpot, clickPlace, enterPlace, escapePlace, placeOf } from '../../../src/lib/scene/navigate.ts';

Deno.test('the window is the one object that needs no trip, and the others are gone to', () => {
  assertEquals(placeOf('window'), null);
  assertEquals(placeOf('monitor'), 'monitor');
  assertEquals(placeOf('music'), 'music');
});

Deno.test('a click on the room around the monitor steps back, and on the room from the room does nothing unless an object is under it', () => {
  assertEquals(clickPlace('monitor', 'monitor', null), 'room');
  assertEquals(clickPlace('room', 'room', null), null);
  assertEquals(clickPlace('room', 'room', 'monitor'), 'monitor');
  assertEquals(clickPlace('room', 'room', 'books'), 'books');
  assertEquals(clickPlace('room', 'room', 'window'), null);
});

Deno.test('from close up a click on bare room steps back, a click on the same object stays, and on another goes to it', () => {
  assertEquals(clickPlace('focus', 'books', null), 'room');
  assertEquals(clickPlace('focus', 'books', 'books'), null);
  assertEquals(clickPlace('focus', 'books', 'posters'), 'posters');
});

Deno.test('nothing is decided while the camera is on its way', () => {
  assertEquals(clickPlace('moving', 'room', 'books'), null);
  assertEquals(escapePlace('moving'), null);
  assertEquals(enterPlace('moving', 'books'), null);
});

Deno.test('escape goes back one step and from the room nowhere, and enter goes to the object chosen from the room, or in to the monitor', () => {
  assertEquals(escapePlace('monitor'), 'room');
  assertEquals(escapePlace('focus'), 'room');
  assertEquals(escapePlace('room'), null);
  assertEquals(enterPlace('room', 'music'), 'music');
  assertEquals(enterPlace('room', null), 'monitor');
  assertEquals(enterPlace('focus', 'music'), null);
});

Deno.test('the first arrow chooses the monitor, and the next ones the neighbours, staying where there is none', () => {
  const anchors = { monitor: { x: 0, y: 0 }, window: { x: -0.5, y: 0.4 } };
  assertEquals(arrowSpot(null, anchors, 'ArrowLeft'), 'monitor');
  assertEquals(arrowSpot('monitor', anchors, 'ArrowLeft'), 'window');
  assertEquals(arrowSpot('window', anchors, 'ArrowLeft'), 'window');
});

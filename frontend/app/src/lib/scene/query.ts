/**
 * Where the monitor is worth having: a screen that is at least `100ch` wide at 80% of the window still holds the
 * window of the site as it is. The same condition is written in the `<head>` script of app.html, which decides before
 * the first paint, and in monitor.css, so a test keeps the three alike.
 */
export const SCENE_QUERY = '(min-width: 1100px) and (min-height: 660px)';

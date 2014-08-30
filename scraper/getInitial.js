var fs = require('fs');

if (! scraper)
  phantom.injectJs('scraper.js');

scraper.initialSet(function(err, initial) {
  if (err) {
    console.error(err);
    throw err;
  }

  fs.write('initial.json', JSON.stringify(initial, null, 2), 'w');

  phantom.exit();
});

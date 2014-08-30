var fs = require('fs');

if (! scraper)
  phantom.injectJs('scraper.js');

var initial = JSON.parse(fs.read('initial.json'));

scraper.dig(initial, function(err, db) {
  if (err) {
    console.error(err);
    throw err;
  }

  fs.write('data.json', JSON.stringify(db, null, 2), 'w');

  phantom.exit();
});

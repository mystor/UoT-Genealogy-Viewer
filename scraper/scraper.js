/* jslint white: false */

// Dependencies
var webpage = require('webpage');

if (typeof async === 'undefined')
  phantom.injectJs('async.js');

if (typeof search === 'undefined')
  phantom.injectJs('search.js');

scraper = (function() {
  var scraper = {};

  function initialSet(callback) {
    var page = webpage.create();
    return search.perform(
      page,
      'su(computer science) AND sch(university of toronto) AND degree(Ph.D.)',
      function(err, res) {
        if (err) return callback(err);

        page.close();
        return callback(null, res);
      });
  }

  function advisedBy(advisor, callback) {
    var page = webpage.create();
    return search.perform(
      page,
      'su(computer science) AND adv(' + advisor + ') AND degree(Ph.D.)',
      function(err, res) {
        if (err) return callback(err);

        page.close();
        return callback(null, res);
      });
  }

  function dig(initial, callback) {
    var queue = async.queue(worker, 4);
    var db = {};

    function worker(task, callback) {
      console.log('Task being run');
      if (db.hasOwnProperty(task.Author)) {
        console.log('Author already registered');
        return callback();
      }

      db[task.Author] = task; // Record that this person is being worked on

      return advisedBy(task.Author, function(err, children) {
        if (err) return callback(err);

        // Remove any children who are not Ph.D.s or who are from China
        children = children.filter(function(child) {
          return child.Degree === 'Ph.D.' &&
            ! /china/i.test(child['Country of publication']);
        });

        // Register the children
        db[task.Author].children = children.map(function(child) {
          return child.Author;
        });

        // Add them to the queue
        children.forEach(function(child) {
          queue.push(child);
        });

        return callback();
      });
    }

    // Set up the initial set
    initial.forEach(function(item) {
      if (item.Degree === 'Ph.D.' && // Ensure only Ph.D. s are dug through
          ! /china/i.test(item['Country of publication'])) { // And ignore china (sorry china)
        queue.push(item);
      }
    });

    // Wait for the queue to empty
    queue.drain = function(err) {
      if (err) return callback(err);

      return callback(null, db);
    };
  }

  scraper.initialSet = initialSet;
  scraper.dig = dig;
  return scraper;
})();

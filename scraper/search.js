var system = require('system');

// Ensure async is avaliable
if (typeof async === 'undefined')
  phantom.injectJs('async.js');

if (typeof blowUp === 'undefined')
  phantom.injectJs('error.js');

search = (function() {
  var search = {};

  // Injects a click function into the given page
  function injectClickFunction(page) {
    page.evaluate(function() {
      function click(el) { // Send a click event
        var ev = document.createEvent('MouseEvent');
        ev.initMouseEvent(
          "click",
          true, true,
          window, null,
          0, 0, 0, 0,
          false, false, false, false,
          0, null
        );
        el.dispatchEvent(ev);
      }

      window.doClick = click;
    });
  }

  // Injects a trim function into the given page
  function injectTrimFunction(page) {
    page.evaluate(function() {
      function trim(x) {
        return x.replace(/&\s+|\s+$/gm, '');
      }

      window.trim = trim;
    });
  }

  function attachCallbacks(page) {
    page.settings.resourceTimeout = 5000;
    page.isLoading = false;
    page.isReloading = 0;

    page.onConsoleMessage = function(message) {
      console.log(message);
    };

    page.onError = function(error) {
      console.error(error);
    };

    page.onLoadFinished = function(status) {
      if (status === 'fail') {
        if (page.isReloading >= 10) {
          page.render('error.png');
          console.log('!!!!Page failed to load!!!');
        } else {
          page.isReloading++;
          page.reload();
          return;
        }
      }

      page.isReloading = 0;
      page.isLoading = false;
    };

    page.onLoadStarted = function() {
      page.isLoading = true;
    };
  }
  // Calls the callback `callback` once the page has loaded
  function waitForLoad(page, callback) {
    console.log('waiting for load');

    var i = 0;
    system.stdout.write('');
    var interval = setInterval(function() {
      system.stdout.write('\r' + i++);
      // console.log(i++);
      if (! page.isLoading) {
        console.log('load finished');
        callback();
        clearInterval(interval);
      }
    }, 100);
  }

  //////////////////////////////////////////
  // Retrieving Results from Results Page //
  //////////////////////////////////////////

  // Should be run when looking at a results page for a search
  // query on Proquest. Will attempt to obtain all data form that
  // search query, and will return an array of all of the results
  function getResults(page, callback) {
    var results = [];

    async.series([
      function(callback) {
        // Ensure we are on the correct tab
        if (goCorrectTab(page)) {
          waitForLoad(page, callback);
        } else {
          callback();
        }
      },

      function(callback) {
        // Go to the abstract page
        if (goAbstractPage(page)) {
          waitForLoad(page, function(err) {
            if (err) blowUp(err);

            readAllData(page, results, callback);
          });
        } else {
          callback(); // Escape from the program - there are no results
        }
      }
    ], function(err) {
      if (err) blowUp(err);

      console.log('Got ' + results.length + ' results!');

      callback(null, results);
    });
  }

  // Ensure that we are on the correct tab of the proquest results,
  // and navigate to it if we aren't
  // Returns true if navigation has occured
  function goCorrectTab(page) {
    injectClickFunction(page);
    return page.evaluate(function() {
      var allResultsLink = document.querySelector('#allResults a');
      if (! allResultsLink)
        return false;

      doClick(allResultsLink);
      return true;
    });
  }

  // Navigates to the abstract page from the proquest results,
  // Returns true if this can occur, and false if it is impossible
  function goAbstractPage(page) {
    injectClickFunction(page);
    return page.evaluate(function() {
      var abstractLink = document.querySelector('.format_abstract');

      if (abstractLink) {
        doClick(abstractLink);
        return true;
      } else {
        return false;
      }
    });
  }

  // Read all data in the current page, and then recursively
  // call itself for the next item in the list.
  // This shouldn't cause stack-overflow because async
  function readAllData(page, results, callback) {
    injectClickFunction(page);
    injectTrimFunction(page);

    // Get the information out of the page
    var result = page.evaluate(function() {
      var rows = document.querySelectorAll('.display_record_indexing_row');
      var result = {};

      for (var i = 0; i < rows.length; i++) {
        // Go through each data row and store the data
        var row = rows[i];
        var keyElement = row.querySelector('.display_record_indexing_fieldname');
        var valueElement = row.querySelector('.display_record_indexing_data');
        if (keyElement && valueElement) {
          var key = trim(keyElement.textContent);
          var value = trim(valueElement.textContent);
          result[key] = value;
        }
      }

      return result;
    });

    if (typeof result.Author === 'undefined') {
      var wrongPage = page.evaluate(function() {
        var correctPageLink = document.querySelector('.format_abstract');

        if (correctPageLink) {
          doClick(correctPageLink);
          return true;
        } else {
          return false;
        }
      });

      if (wrongPage) {
        console.log('On wrong page, redirecting to correct page');
        waitForLoad(page, function() {
          readAllData(page, results, callback);
        });
      } else {
        blowUp(results, page);
      }

      return;
    }

    console.log('Read ' + result.Author);

    results.push(result);

    // Try to navigate to the next entry
    var canNavigate = page.evaluate(function() {
      var nextPageLink = document.querySelector('.next');
      if (nextPageLink) {
        doClick(nextPageLink);
        return true;
      } else {
        return false;
      }
    });

    if (canNavigate) {
      waitForLoad(page, function(err) {
        if (err) blowUp(err);

        readAllData(page, results, callback);
      });
    } else {
      callback();
    }
  }

  //////////////////////
  // Perform a search //
  //////////////////////

  // Navigates to the search page, performs a search request,
  // and then retrieves all data from the results
  function performSearch(page, query, callback) {
    attachCallbacks(page);

    console.log('Performing Query: ' + query);
    page.open('http://search.proquest.com', function(status) {
      injectClickFunction(page);

      var success = page.evaluate(function(query) {
        // Get the search field
        var queryTermField = document.getElementById('queryTermField') ||
              document.getElementById('searchTerm');
        if (! queryTermField) return false;

        // Set the search value
        queryTermField.value = query;

        // Get the search button
        var searchButton = document.getElementById('searchToResultPage') ||
              document.getElementById('submit_4');
        if (! searchButton) return false;

        // Perform the search
        doClick(searchButton);

        return true;
      }, query);

      if (success) {
        waitForLoad(page, function(err) {
          if (err) blowUp(err);

          return getResults(page, callback);
        });
      } else {
        callback(new Error('could not search'));
      }
    });
  }

  search.perform = performSearch;
  return search;
})();

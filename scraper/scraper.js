/* jslint white: false */
phantom.injectJs('async.js');
var webpage = require('webpage');
var fs = require('fs');

function getPageContents(page) {
  return page.evaluate(function () {
    var students = [];
    var items = document.querySelectorAll('.titleAuthorETC');

    for (var i = 1; i < items.length; i+=2) {
      var author = items[i-1].innerText; // Get the name
      author = author.substring(0, author.length - 1); // Remove the period

      // Extract the year and school
      var moreText = items[i].innerText;
      var more = moreText.split(',').map(function(x) { return x.trim(); });
      var year = parseInt(more[3].substring(0, 4));

      if (/People's Republic of China/.test(more[0])) // Unfortunately, there are too many name conflicts here - we have to skip it
        continue;

      students.push({
        author: author,
        school: more[0],
        year: year
      });
    }

    return students;
  });
}

function getStudents(advisor, callback) {
  console.log("Discovering students for advisor: " + advisor);

  var page = webpage.create();
  var index = 0;
  var loadInProgress = false;

  page.onConsoleMessage = function (x) {
    console.log(x);
  };

  page.onLoadStarted = function () {
    loadInProgress = true;
    console.log("load started");
  };

  page.onLoadFinished = function () {
    loadInProgress = false;
    console.log("load finished");
  };

  var steps = [
    function() {
      page.open('http://search.proquest.com/advanced');
    },

    function() {
      page.evaluate(function (advisor) {
        function click(el) {
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
        var queryTermField = document.getElementById('queryTermField');
              // document.getElementById('searchTerm');
        queryTermField.value = "su(computer science) AND adv(" + advisor + ")";
        var searchButton = document.getElementById('searchToResultPage');
              // document.getElementById('submit_4');
        click(searchButton);
      }, advisor);
    },

    function() {
      return getPageContents(page);
    }
  ];

  var interval = setInterval(function () {
    var data;

    if (! loadInProgress && typeof steps[index] == "function") {
      console.log("step " + (index + 1));
      data = steps[index]();
      index++;
    }
    if (typeof steps[index] != "function") {
      console.log("complete!");
      clearInterval(interval);
      page.close();
      callback(null, data);
    }
  }, 50);
}

function getStudentsPrime(page, advisor, callback) {
  console.log("Discovering students for advisor: " + advisor);

  var loadInProgress = false;
  page.onLoadStarted = function () {
    loadInProgress = true;
    console.log("load started");
  };

  page.onLoadFinished = function () {
    loadInProgress = false;
    console.log("load finished");
  };

  var success = page.evaluate(function (advisor) {
    try {
      function click(el) {
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
      var queryTermField = document.getElementById('queryTermField') ||
            document.getElementById('searchTerm');
      queryTermField.value = "su(computer science) AND adv(" + advisor + ")";
      var searchButton = document.getElementById('searchToResultPage') ||
            document.getElementById('submit_4');
      click(searchButton);
      return true;
    } catch (e) {
      return false;
    }
  }, advisor);

  if (success) {
    var interval = setInterval(function() {
      if (! loadInProgress) {
        var data = getPageContents(page);
        console.log("Got data");
        clearInterval(interval);
        callback(null, data);
      }
    }, 50);
  } else {
    console.log("**** ERROR ENCOUNTERED - Attempting to return to proquest search ****");
    page.open('http://search.proquest.com/', function() {
      console.log("**** recovered ****");
      getStudentsPrime(page, advisor, callback);
    });
  }
}

function getInitial(callback) {
  var page = webpage.create();
  var loadInProgress = false;

  page.onConsoleMessage = function (x, line, source) {
    console.log("page logs: " + source + ":" + line + ": " + x);
  };

  page.onLoadStarted = function () {
    loadInProgress = true;
    console.log("load started");
  };

  page.onLoadFinished = function () {
    loadInProgress = false;
    console.log("load finished");
  };

  page.open('http://search.proquest.com/', function () {

    page.evaluate(function () {
      function click(el) {
        var ev = document.createEvent('MouseEvent');
        ev.initMouseEvent(
          "click",
          true, true,
          window, null,
          0, 0, 0, 0,
          false, false, false, false,
          0, null
        );
        console.log("about-to-click==b");
        el.dispatchEvent(ev);
        console.log("just-clicked==b");
      }
      var queryTermField = document.getElementById('queryTermField');
      queryTermField.value = "su(computer science) AND sch(university of toronto)";
      var searchButton = document.getElementById('searchToResultPage');
      click(searchButton);
    });

    var page_num = 1;
    var data = [];

    var interval = setInterval(function () {
      if (! loadInProgress) {
        console.log("step " + page_num);
        var newData = getPageContents(page);

        console.log(JSON.stringify(newData, null, 2));

        if (newData.length <= 0) {
          console.log("complete!");
          clearInterval(interval);
          page.close();
          callback(null, data);
        } else {
          // Go to the next page!
          var done = page.evaluate(function () {
            try {
              function click(el) {
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
              var nextPageLink = document.querySelector('a[title=Next\\ page]');
              click(nextPageLink);
              return false;
            } catch (e) {
              return true;
            }
          });

          data = data.concat(newData);
          page_num++;
          console.log("done: " + done);

          if (done) {
            console.log("complete! -- 2");
            clearInterval(interval);
            page.close();
            callback(null, data);
          }
        }
      }
    }, 50);
  });
}

function getInitialCached(callback) {
  var f, data;
  try {
    f = fs.open('initial.json', 'r');
    data = JSON.parse(f.read());
  } catch (e) {
    callback(e);
  }

  f.close();

  if (data) callback(null, data);
}

function getDone() {
  var f, data;
  try {
    f = fs.open('done2.json', 'r');
    data = JSON.parse(f.read());
  } catch(e) {
    throw e;
  }

  f.close();

  var out = {};
  data.forEach(function(person) {
    out[person.author] = person;
  });

  return out;
}

function getAllData(callback) {
  var sd = {}; //getDone();

  function mkWorker(callback) {
    var page = webpage.create();

    function worker(person, callback) {
      if (! sd.hasOwnProperty(person.author)) {
        sd[person.author] = person;

        getStudentsPrime(page, person.author, function(err, students) {
          person.students = students.map(function(student) {
            return student.author;
          });

          console.log(JSON.stringify(person, null, 2));

          async.eachLimit(students, 1, worker, callback);
        });
      } else {
        callback(null);
      }
    }

    page.open('http://search.proquest.com/', function() {
      console.log("Made Worker");
      callback(null, worker);
    });
  }


  async.waterfall([
    getInitialCached,
    function(initial, callback) {
      async.parallel([mkWorker, mkWorker, mkWorker, mkWorker], function(err, workers) {
        console.log("Made Workers");

        function workerRun(worker, callback) {
          var item = initial.pop();
          if (item) {
            console.log("Got Item");
            worker(item, function(err) {
              if (err)
                return callback(err);

              return workerRun(worker, callback);
            });
          } else {
            console.log("Worker Done");
            callback(null);
          }
        }
        async.each(workers, workerRun, callback);
      });
    }
  ], function(err) {
    if (err)
      callback(err);
    else
      callback(null, sd);
  });
}

getAllData(function(err, data) {
  if (err) {
    console.log("ERROR: " + err);
    throw err;
  }

  console.log("*************START_DUMP");
  console.log(JSON.stringify(data, null, 2));
});

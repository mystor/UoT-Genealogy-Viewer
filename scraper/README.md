# Scraper
This is the scraper which was used to get the original information off of Proquest.

It is written in JavaScript, for use with [PhantomJS](phantomjs.org).

To run it, do
```bash
$ phantomjs scraper.js > log.txt &
$ tail -f log.txt
```

The output JSON data will be dumped at the end of the log (yeah, sorry), open the log in a text editor to extract it.

## Next Steps
This is an awful piece of software, and it should probably be rewritten from scratch

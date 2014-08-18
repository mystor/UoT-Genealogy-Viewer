# UoT CS Genealogy Viewer
This is a very basic viewer for showing the UoT CS Genealogy data which has been collected.

## Running
Create a [virtualenv](http://virtualenv.readthedocs.org/en/latest/).
```bash
$ virtualenv env
$ . env/bin/activate
```

Install the dependencies
```bash
$ pip install -r requirements.txt
```

Run the development server
```bash
$ python viewer.py
 * Running on http://127.0.0.1:3000/
```

Visit [the viewer](http://127.0.0.1:3000/), or the [admin interface](http://127.0.0.1:3000/admin)

## Next Steps
This viewer was created over the course of ~2-3 hours. Both it and the dataset are very immature.
These are a few things which need to be done at some point, but which I didn't have time to do.

 - Make the admin interface password protected
 - Clean up the dataset, and improve it's accuracy
 - Present an obvious way for users to submit suggestions for improvements
 - Add aliases (alternate names) for people (e.g. Salay, Richard == Salay, Rick)
 - Make the interface look nicer

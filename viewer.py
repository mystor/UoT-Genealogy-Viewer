from flask import Flask, render_template, abort, url_for, redirect, request
from flask.ext.admin import Admin, BaseView, expose
from flask.ext.admin.contrib.sqla import ModelView
from models import db, Person

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
db.init_app(app)
with app.app_context():
    db.create_all()

# Create an admin view for editing the data
# TODO: Make this password-protected or similar
admin = Admin(app, name='UoT CS Genealogy')
admin.add_view(ModelView(Person, db.session))

# Render the homepage
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/search')
def search():
    query = request.args.get('q', '')
    if query:
        people = db.session.query(Person).filter(Person.name.like('%'+query+'%'))
    else:
        return redirect(url_for('home'))

    return render_template('results.html', people=people)

@app.route('/person/<int:person_id>')
def person(person_id):
    person = db.session.query(Person).get(person_id)
    if person == None:
        return abort(404)

    return render_template('person.html', person=person)

if __name__ == '__main__':
    app.run(port=3000, debug=True)

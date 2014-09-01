from flask import Flask
import json
from models import db, Person

# This is a flask app because... why not.
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'

@app.route('/import')
def import_data():
    people = {}
    with open('data.json', 'r') as f:
        data = json.load(f)

    # Create the person objects
    for item in data.values():
        p = Person(item['Author'], item['University/institution'], int(item['Degree date']))
        people[item['Author']] = p
        db.session.add(p)

    # Create the associations
    for item in data.values():
        person = people[item['Author']]
        advisor = people.get(item.get('Advisor', ''), None)
        if advisor != None:
            advisor.students.append(person)

    db.session.commit()

    return 'SUCCESS!'

if __name__ == '__main__':
    db.init_app(app)
    with app.app_context():
        db.create_all()

    app.run(port=3000, debug=True)

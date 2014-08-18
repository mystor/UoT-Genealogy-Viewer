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
        p = Person(item['author'], item['school'], item.get('year', 'Unknown'))
        people[item['author']] = p
        db.session.add(p)

    # Create the associations
    for item in data.values():
        person = people[item['author']]

        for student in item['students']:
            if (student in people and                                   # Person exists
                item['author'] != student and                           # Not the same person
                item.get('year', 0) < data[student].get('year', 3000)): # PhD at the time
                person.students.append(people[student])

    db.session.commit()

    return 'SUCCESS!'

if __name__ == '__main__':
    db.init_app(app)
    with app.app_context():
        db.create_all()

    app.run(port=3000, debug=True)

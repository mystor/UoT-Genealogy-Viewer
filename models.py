from flask.ext.sqlalchemy import SQLAlchemy

db = SQLAlchemy()

advisors = db.Table('advisors',
    db.Column('advisor', db.Integer, db.ForeignKey('person.id'), primary_key=True),
    db.Column('student', db.Integer, db.ForeignKey('person.id'), primary_key=True)
)


class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    school = db.Column(db.String())
    year = db.Column(db.String())

    students = db.relationship('Person', secondary=advisors,
        primaryjoin=id==advisors.c.advisor,
        secondaryjoin=id==advisors.c.student,
        backref=db.backref('advisors', lazy='dynamic'))

    def __init__(self, name="", school="", year=""):
        self.name = name
        self.school = school
        self.year = year

    def __repr__(self):
        return "{} ({} - {})".format(self.name, self.school, self.year)
        # return "Person({}, {}, {})".format(self.name, self.school, self.year)

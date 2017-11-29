var MongoClient = require('mongodb').MongoClient;
var dbConnection = null;
var lockCount = 0;


function getDbConnection(callback) {
    MongoClient.connect("mongodb://localhost/maruko", function (err, db) {
        if (err) {
            console.log("Unable to connect to Mongodb");
        } else {
            dbConnection = db;
            callback();
        }
    });
};

function closeConnection() {
    if (dbConnection)
        dbConnection.close();

}

getDbConnection(function () {
    dbConnection.dropDatabase(function (err, doc) {
        if (err)
            console.log("Could not drop database");
        else
            addUser();
    });
});

function addUser() {
    u = [
        {
            "firstName": "Lan",
            "lastName": "Liu",
            "userName": "nanica",
            "phoneNumber": "729740375",
            "emailAddress": "liulanm518@gmail.com",
            "password": "6zHCVMaK3eCH5Z0R9GDwbQ==",  // pangchao
            "profilePhotoURL": "https://goo.gl/UDjm25"
        },
        {
            "firstName": "Hechao",
            "lastName": "Li",
            "userName": "monkey",
            "phoneNumber": "4124787376",
            "emailAddress": "hechaol@outlook.com",
            "password": "06pEQujcQHqtiTTvEND20A==",  // bennan
            "profilePhotoURL": "https://goo.gl/oiKQ9M"
        },
        {
            "firstName": "Chandler",
            "lastName": "Bing",
            "userName": "chanandlerbong",
            "phoneNumber": "6505262411",
            "emailAddress": "chanandlerbong@gmail.com",
            "password": "6ZGCXooPkxCGYhknU1JPng==",  // qc123
            "profilePhotoURL": "https://goo.gl/7q7qD2"
        },
        {
            "firstName": "Miaozhen",
            "lastName": "Zhang",
            "userName": "zmz",
            "phoneNumber": "6692460962",
            "emailAddress": "miaozhenzhang666@gmail.com",
            "password": "dI0i5BfYUtPMvYkJ//XOhg==",  // zmz1010
            "profilePhotoURL": "https://goo.gl/UDjm25"
        },
        {
            "firstName": "Qian",
            "lastName": "Chen",
            "userName": "qc",
            "phoneNumber": "6505262411",
            "emailAddress": "happyqianchen@gmail.com",
            "password": "6ZGCXooPkxCGYhknU1JPng==",  // qc123
            "profilePhotoURL": "https://goo.gl/7q7qD2"
        }
    ];
    var users = dbConnection.collection('users');

    //add calendars and events
    users.insertOne(u[0], function (err, doc) {
        if (err) {
            console.log("Could not add user 1.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 100);
        }
    })
    users.insertOne(u[1], function (err, doc) {
        if (err) {
            console.log("Could not add user 2.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 110);
        }
    })
    users.insertOne(u[2], function (err, doc) {
        if (err) {
            console.log("Could not add user 3.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 120);
        }
    })
    users.insertOne(u[3], function (err, doc) {
        if (err) {
            console.log("Could not add user 4.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 110);
        }
    })
    users.insertOne(u[4], function (err, doc) {
        if (err) {
            console.log("Could not add user 5.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 120);
        }
    })
}

//generate calendar lists

calendarNameList = ['School', 'Others', 'Exciting Activities', 'Study Plan', 'Self Improvement', 'With friends'];
descriptionList = ['Do not miss it.', 'Must Execute.', 'Do not forget to ask for permission first', 'Had to talk to XX', 'Have a plan B'];

function addCalendarToUser(userId, count) {

    var cal = [];

    for (i = 0; i < count; i++) {
        var calendarName = calendarNameList[Math.floor(Math.random() * calendarNameList.length)];
        var description = descriptionList[Math.floor(Math.random() * descriptionList.length)];

        cal.push({
            calendarName: calendarName,
            description: description,
            userId: userId
        });
    }

    cal.forEach(function (calendar) {
        var calendars = dbConnection.collection('calendars');
        calendars.insertOne(calendar, function (err, doc) {
            if (err) {
                console.log("Could not add driver 1");
            }
            else {
                addEventsToCalendar(doc.ops[0]._id.toString(), 200);
            }
        });
    })
}


//generate event list

eventList = ['Job Fair', 'Seminar', 'Keynote Speech', 'Festival', 'Party', 'Meetup', 'Family and Friends Reunion'];
eventLocationList = ['School BLVD 23', 'School BLVD 19', 'San Francisco', 'Sunnyvale', 'Santa Clara']
eventColorList = ['red', 'blue', 'green', 'yellow', 'pink', 'orange', 'purple']
importantLevelList = ['!', '!!', '!!!']

function addEventsToCalendar(calendarId, count) {
    var eve = [];
    for (i = 0; i < count; i++) {
        var eventName = eventList[Math.floor(Math.random() * eventList.length)];
        var eventLocation = eventLocationList[Math.floor(Math.random() * eventLocationList.length)];
        var eventColor = eventColorList [Math.floor(Math.random() * eventColorList.length)];
        var importantLevel = importantLevelList [Math.floor(Math.random() * importantLevelList.length)];
        var description = "default description"


        eve.push({
            eventName: eventName,
            eventLocation: eventLocation,
            eventColor: eventColor,
            importantLevel: importantLevel,
            calendarId: calendarId,
            description: description

        });
    }

    eve.forEach(function (event) {
        var events = dbConnection.collection('events');
        events.insertOne(event);
    })

}


setTimeout(closeConnection, 5000);

//generate note list

captionList = ['Call Jennifer', 'Shopping List', 'APP Homework', 'Student Work', 'Hackathon Volunteer',
    'Submit Job Application Online', 'Buy a car', 'Gift Ideas', 'Youtube Description', 'Personal Blog'];
contentList = {};
contentList["Call Jennifer"] = ['English Language Workshop'];
contentList["Shopping List"] = ['Milk', 'Bread', 'Earl Grey', 'Lemonade', 'Pasta', 'Biscuits', 'Coke'];
contentList["APP Homework"] = ['Session 7 - Query Parameters'];
contentList["Student Work"] = ['Speak to Allison', 'Ask Allison for requirements',
    'Discuss task deadline', 'Upload new photos', 'Organize Hackathon photos', 'Upload student portray'];
contentList["Hackathon Volunteer"] = ['Saturday 8:00AM ~ 10:00PM'];
contentList["Submit Job Application Online"] = ['Google', 'Facebook', 'Amazon', 'LinkedIn', 'Apple', 'Oracle'];
contentList["Buy a car"] = ['2018 Camaro'];
contentList["Gift Ideas"] = ['Journal', 'Chocolate', 'Cake', 'Pens', 'Wallet', 'Popcorn', 'Books', 'Scarf', 'Tea'];
contentList["Youtube Description"] = ['Rachel\'s English'];
contentList["Personal Blog"] = ['Start working on a blog idea', 'Think of a domain name',
    'Think and write at least 5 posts', 'Register a domain name and select host', 'Upload posts', 'Logo design'];
typeList = [0, 1];
// remindTime range: 2017-01-01 00:00 to 3017-01-01 00:00.
startRemindTime = 1485903600000;
endRemindTime = 33042812400000;


function addNotesToUser(userId, count) {
    sequence = Array(count);
    console.log("sequence", sequence);
    var n = [];
    for (i = 0; i < count; i++) {
        console.log("Trying")

        var noteCaption = captionList[Math.floor(Math.random() * captionList.length)];
        var noteType = typeList[Math.floor(Math.random() * typeList.length)];
        var isPinned = Math.random() >= 0.5;
        var remindTime = Number(Math.floor((Math.random()
            * (endRemindTime - startRemindTime) + startRemindTime) / 100000) * 100000);

        var noteContent = [];
        if (noteType == 0) {
            noteContent.push(
                contentList[noteCaption] [Math.floor(Math.random() * contentList[noteCaption].length)]
            );
        } else {
            for (j = 0; j < Number(Math.floor(Math.random() * contentList[noteCaption].length)) + 1; j++) {
                noteContent.push(
                    contentList[noteCaption] [Math.floor(Math.random() * contentList[noteCaption].length)]
                );
            }
        }

        n.push({
            userId: userId,
            noteCaption: noteCaption,
            noteContent: noteContent,
            noteType: noteType,
            isPinned: isPinned,
            remindTime: new Date(remindTime)
        });
    }

    n.forEach(function (note) {
        var notes = dbConnection.collection('notes');
        notes.insertOne(note);
    })

    //generate health list

    // recordTime range: 2017-01-01 00:00 to 3017-01-01 00:00.
    startRecordTime = 1485903600000;
    endRecordTime = 33042812400000;
    hoursOfSleepList = [5, 6, 7, 8, 9, 10];
    threeMealsList = ['Egg', 'Milk', 'Pork', 'Vegetables', 'Pasta', 'Rice', 'Beef', 'Salad',
        'Lemonade', 'Red Wine', 'Noodle', 'Chicken', 'Tomato', 'Potato'];
    weightList = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70];
    moodDiaryList = ['Very Happy', 'Happy', 'Normal', 'Unhappy', 'Very Unhappy'];
    moodDiaryList = {};

    function addHealthsToUser(userId, count) {
        sequence = Array(count);
        console.log("sequence", sequence);
        var h = [];
        for (i = 0; i < count; i++) {
            console.log("Trying")

            var recordTime = Number(Math.floor((Math.random()
                * (endRecordTime - startRecordTime) + startRecordTime) / 100000) * 100000);
            var goToBedOnTime = Math.random() >= 0.5;
            var wakeUpOnTime = Math.random() >= 0.5;
            var hoursOfSleep = hoursOfSleepList[Math.floor(Math.random() * hoursOfSleepList.length)];
            var haveExercise = Math.random() >= 0.5;
            var threeMeals = [];
            for (j = 0; j < Number(Math.floor(Math.random() * threeMealsList.length)) + 1; j++) {
                threeMealsList.push(
                    threeMealsList [Math.floor(Math.random() * threeMealsList.length)]
                );
            }
            var weight = weightList[Math.floor(Math.random() * hoursOfSleepList.length)];
            var moodDiary = moodDiaryList[Math.floor(Math.random() * moodDiaryList.length)];

            h.push({
                userId: userId,
                recordTime: new Date(recordTime),
                goToBedOnTime: goToBedOnTime,
                wakeUpOnTime: wakeUpOnTime,
                hoursOfSleep: hoursOfSleep,
                haveExercise: haveExercise,
                threeMeals: threeMeals,
                weight: weight,
                moodDiary: moodDiary
            });
        }

        h.forEach(function (health) {
            var healths = dbConnection.collection('healths');
            healths.insertOne(health);
        })
    }
}




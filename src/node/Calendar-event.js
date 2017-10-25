var MongoClient = require('mongodb').MongoClient;
var dbConnection = null;
var lockCount = 0;



function getDbConnection(callback){
    MongoClient.connect("mongodb://localhost/maruko", function(err, db){
        if(err){
            console.log("Unable to connect to Mongodb");
        }else{
            dbConnection = db;
            callback();
        }
    });
};

function closeConnection() {
    if (dbConnection)
        dbConnection.close();

}

getDbConnection(function(){
    dbConnection.dropDatabase(function(err,doc){
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
        }
    ];
    var users = dbConnection.collection('users');
    users.insertOne(u[0], function (err, doc) {
        if (err) {
            console.log("Could not add user 0.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
        }
    })
    users.insertOne(u[1], function (err, doc) {
        if (err) {
            console.log("Could not add user 1.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
        }
    })
    users.insertOne(u[2], function (err, doc) {
        if (err) {
            console.log("Could not add user 2.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
        }
    })
}

calendarNameList = ['The events I must attend','The events that are very interested, probably would go','I would seek time to attend'];
descriptionList = ['This calendar is the events I must attend every week.','This calendar includes all the career events that are interesting and I would like to attend.', 'This calendar includes all the career events I would like to attend but may not have']

function addCalendarToUser(userId, count) {

    var cal = [];

    for (i = 0; i < count; i++) {
        var calendarName = calendarNameList[Math.floor(Math.random()* calendarNameList.length)];
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
            if (err){
                console.log("Could not add driver 1");
            }
            else {
                addEventsToCalendar(doc.ops[0]._id.toString(), 200);
            }
        });
    })
}




eventList = ['Job Fair','Seminar','Keynote Speech','Festival','Party','Meetup','Family and Friends Reunion'];
eventLocationList = ['School BLVD 23','School BLVD 19', 'San Francisco','Sunnyvale','Santa Clara']
eventColorList = ['red','blue','green','yellow','pink','orange','purple']
importantLevelList = ['!','!!','!!!', null]

function addEventsToCalendar (calendarId,count) {
    var eve = [];
    for (i=0;i<count;i++){
        var eventName = eventList[Math.floor(Math.random()* eventList.length)];
        var eventLocation = eventLocationList[Math.floor(Math.random() * eventLocationList.length)];
        var eventColor = eventColorList [Math.floor(Math.random() * eventColorList.length)];
        var importantLevel = importantLevelList [Math.floor(Math.random() * importantLevelList.length)];
        var description = "default description"


        eve.push({
            eventName: eventName,
            eventLocation: eventLocation,
            eventColor:eventColor,
            importantLevel:importantLevel,
            calendarId:calendarId,
            description:description

        });
    }

    eve.forEach(function (event) {
        var events =  dbConnection.collection('events');
        events.insertOne(event);
    })

}


setTimeout(closeConnection,5000);


//6zHCVMaK3eCH5Z0R9GDwbQ==
//06pEQujcQHqtiTTvEND20A==








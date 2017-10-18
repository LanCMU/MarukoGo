var MongoClient = require('mongodb').MongoClient;

var dbConnection = null;

var lockCount = 0;



function getDbConnection(callback){
    MongoClient.connect("mongodb://localhost/app17-5", function(err, db){
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
            addCalendar();
    });
});

function addCalendar() {
    cal = [{
        "calendarName":    "Study Plan",
        "discription":     "This calendar is all the regular classes every week.",
        "userId":       "liulanm518",
        "displayOfCalendar":     "weekly"
    },
        {
            "calendarName":    "Job Events",
            "discription":     "This calendar includes all the career events I would like to attend.",
            "userId":       "nanica123",
            "displayOfCalendar":     "daily"
        }];
    var calendars = dbConnection.collection('calendars');
    calendars.insertOne(cal[0], function(err,doc){
        if (err){
            console.log("Could not add calendar 1");
        }
        else {
            addEventstoCalendar0(doc.ops[0]._id.toString());
        }
    })
    calendars.insertOne(cal[1], function(err,doc){
        if (err){
            console.log("Could not add calendar 2");
        }
        else {
            addEventstoCalendar1(doc.ops[0]._id.toString());
        }
    })
}

function addEventstoCalendar0(calendarId) {
    eve = [{
        "eventName" : "APP Class",
        "eventStartTime" : "10/11/2017 17:30",
        "eventEndTime" : "10/11/2017 21:30",
        "eventLocation" : "Room 217",
        "eventDiscription" : "APP Class" ,
        "eventColor" : "orange",
        "collabratorId" : "8273238",
        "importantLevel" : "!!!",
        "calendarId" : calendarId
    },{
        "eventName" : "PDV Class",
        "eventStartTime" : "17/09/2017 12:00",
        "eventEndTime" : "17/09/2017 13:30",
        "eventLocation" : "Room 119",
        "eventDiscription" : "PDV Presentation" ,
        "eventColor" : "blue",
        "collabratorId" : "0238023",
        "importantLevel" : "!!",
        "calendarId" : calendarId
    },{
        "eventName" : "SEM Class",
        "eventStartTime" : "08/11/2017 11:30",
        "eventEndTime" : "08/11/2017 13:20",
        "eventLocation" : "Room 110",
        "eventDiscription" : "SEM Kickoff" ,
        "eventColor" : "green",
        "collabratorId" : "0238023",
        "importantLevel" : "!!",
        "calendarId" : calendarId
    }];
    eve.forEach(function(event){
        var events = dbConnection.collection('events');
        events.insertOne(event);
    })

}

function addEventstoCalendar1(calendarId) {
    eve = [{
        "eventName" : "Unity ML Talk",
        "eventStartTime" : "10/10/2017 18:00",
        "eventEndTime" : "10/10/2017 19:00",
        "eventLocation" : "Room 109",
        "eventDiscription" : "Unity Company Talk Session and Recruiting" ,
        "eventColor" : "red",
        "collabratorId" : "63873213",
        "importantLevel" : "!!!",
        "calendarId" : calendarId
    },{
        "eventName" : "Pixar Story",
        "eventStartTime" : "15/09/2017 14:00",
        "eventEndTime" : "15/09/2017 16:30",
        "eventLocation" : "Room 211",
        "eventDiscription" : "Looking forwards to listening Steve Job's part!" ,
        "eventColor" : "yellow",
        "collabratorId" : "7292938",
        "importantLevel" : "!!",
        "calendarId" : calendarId
    }];
    eve.forEach(function(event){
        var events = dbConnection.collection('events');
        events.insertOne(event);
    })

}

setTimeout(closeConnection,5000);
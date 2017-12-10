var MongoClient = require('mongodb').MongoClient;
var dbConnection = null;

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
            "profilePhotoURL": "https://goo.gl/UDjm25",
            "isPrime": false
        },
        {
            "firstName": "Hechao",
            "lastName": "Li",
            "userName": "monkey",
            "phoneNumber": "4124787376",
            "emailAddress": "hechaol@outlook.com",
            "password": "06pEQujcQHqtiTTvEND20A==",  // bennan
            "profilePhotoURL": "https://goo.gl/oiKQ9M",
            "isPrime": false
        },
        {
            "firstName": "Chandler",
            "lastName": "Bing",
            "userName": "chanandlerbong",
            "phoneNumber": "6505262411",
            "emailAddress": "chanandlerbong@gmail.com",
            "password": "6ZGCXooPkxCGYhknU1JPng==",  // qc123
            "profilePhotoURL": "https://goo.gl/7q7qD2",
            "isPrime": true
        },
        {
            "firstName": "Miaozhen",
            "lastName": "Zhang",
            "userName": "zmz",
            "phoneNumber": "6692460962",
            "emailAddress": "miaozhenzhang666@gmail.com",
            "password": "dI0i5BfYUtPMvYkJ//XOhg==",  // zmz1010
            "profilePhotoURL": "https://goo.gl/UDjm25",
            "isPrime": true
        },
        {
            "firstName": "Qian",
            "lastName": "Chen",
            "userName": "qc",
            "phoneNumber": "6505262411",
            "emailAddress": "happyqianchen@gmail.com",
            "password": "6ZGCXooPkxCGYhknU1JPng==",  // qc123
            "profilePhotoURL": "https://goo.gl/7q7qD2",
            "isPrime": false
        }
    ];
    var users = dbConnection.collection('users');

    // add calendars, notes, healths, todos, reviews
    users.insertOne(u[0], function (err, doc) {
        if (err) {
            console.log("Could not add user 1.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 100);
            addHealthsToUser(doc.ops[0]._id.toString(), 100);
            addTodosToUser(doc.ops[0]._id.toString(), 10);
            addReviewsToUser(doc.ops[0]._id.toString(), 10);
        }
    })
    users.insertOne(u[1], function (err, doc) {
        if (err) {
            console.log("Could not add user 2.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 110);
            addHealthsToUser(doc.ops[0]._id.toString(), 110);
            addTodosToUser(doc.ops[0]._id.toString(), 20);
            addReviewsToUser(doc.ops[0]._id.toString(), 10);
        }
    })
    users.insertOne(u[2], function (err, doc) {
        if (err) {
            console.log("Could not add user 3.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 120);
            addHealthsToUser(doc.ops[0]._id.toString(), 120);
            addTodosToUser(doc.ops[0]._id.toString(), 30);
            addReviewsToUser(doc.ops[0]._id.toString(), 10);
        }
    })
    users.insertOne(u[3], function (err, doc) {
        if (err) {
            console.log("Could not add user 4.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 110);
            addHealthsToUser(doc.ops[0]._id.toString(), 110);
            addTodosToUser(doc.ops[0]._id.toString(), 40);
            addReviewsToUser(doc.ops[0]._id.toString(), 20);
        }
    })
    users.insertOne(u[4], function (err, doc) {
        if (err) {
            console.log("Could not add user 5.");
        }
        else {
            addCalendarToUser(doc.ops[0]._id.toString(), 5);
            addNotesToUser(doc.ops[0]._id.toString(), 120);
            addHealthsToUser(doc.ops[0]._id.toString(), 120);
            addTodosToUser(doc.ops[0]._id.toString(), 50);
            addReviewsToUser(doc.ops[0]._id.toString(), 30);
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
}

//generate health list

// recordTime range: 2017-01-01 00:00 to 3017-01-01 00:00.
startRecordTime = 1485903600000;
endRecordTime = 33042812400000;
hoursOfSleepList = [5, 6, 7, 8, 9, 10];
threeMealsList = ['Egg', 'Milk', 'Pork', 'Vegetables', 'Pasta', 'Rice', 'Beef', 'Salad',
    'Lemonade', 'Red Wine', 'Noodle', 'Chicken', 'Tomato', 'Potato'];
weightList = [50.0, 51.1, 52.2, 53.3, 54.4, 55.5, 56.6, 57.7, 58.8, 59.9, 60.0, 61.1, 62.2, 63.3, 64.4, 65.5, 66.6, 67.7, 68.8, 69.9, 70.0];
moodDiaryList = ['Very Happy', 'Happy', 'Normal', 'Unhappy', 'Very Unhappy'];

function addHealthsToUser(userId, count) {
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
            threeMeals.push(
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


//generate todos list

todoCategoryList = ['Study', 'Work', 'Personal Life', 'Hobbies', 'Family', 'Others'];
todoContentList = {};
todoContentList["Study"] = ['APP project', 'SEM report', 'PDV task1', 'FSM outline1'];
todoContentList["Work"] = ['one on one meeting with the manager', 'take event photos',
    'project presentation', 'Ask for customers\' feedback', 'create the new website',
    'discuss the requirements'];
todoContentList["Personal Life"] = ['go to the theater', 'go to the concert', 'learn drawing', 'go to the park',
    'go to the gym', 'play football'];
todoContentList["Hobbies"] = ['play piano', 'play violin', 'play tennis', 'reading',
    'listening to music', 'solve maths problems'];
todoContentList["Family"] = ['watch a movie with mum', 'cook for dad', 'travel with parents',
    'have dinner with my cousin'];
todoContentList["Others"] = ['buy groceries', 'take online courses', 'meet with my friends',
    'go travelling', 'play tennis'];
// dueDate range: 2017-01-01 00:00 to 3017-01-01 00:00.
startDueDate = 1485903600000;
endDueDate = 33042812400000;

function addTodosToUser(userId, count) {
    var t = [];
    for (i = 0; i < count; i++) {
        console.log("Trying")

        var todoCategory = todoCategoryList[Math.floor(Math.random() * todoCategoryList.length)];
        var todoContent = todoContentList[todoCategory] [Math.floor(Math.random() * todoContentList[todoCategory].length)]
        var isImportant = Math.random() >= 0.5;
        var dueDate = Number(Math.floor((Math.random()
            * (endDueDate - startDueDate) + startDueDate) / 100000) * 100000);
        var isFinished = Math.random() >= 0.5;

        t.push({
            userId: userId,
            todoCategory: todoCategory,
            todoContent: todoContent,
            isImportant: isImportant,
            dueDate: new Date(dueDate),
            isFinished: isFinished
        });
    }

    t.forEach(function (todo) {
        var todos = dbConnection.collection('todos');
        todos.insertOne(todo);
    })
}

//generate review list
reviewCategoryList = [0, 1, 2, 3];
titleList = ['Star Wars', 'Wonder Woman', 'Spider Man', 'Dunkirk', 'Coco', 'Logan', 'Blade Runner',
    'Anything Is Possible', 'The Leavers', 'The Hate U Give', 'Exit West', 'Pachinko', 'Turtles All the Way Down',
    'Shape of You', 'Unforgettable', 'Feels', 'Despacito', 'Perfect', 'Thunder', 'New Rules',
    'Concert Review', 'Symphony Review', 'Drama Review', 'TV show Review', 'Arts Review'];
reviewContentList = ['Cat ipsum dolor sit amet, swat turds around the house so toy mouse squeak roll over, ' +
'pushes butt to face. Annoy kitten brother with poking walk on car leaving trail of paw prints on hood and ' +
'windshield intently sniff hand, and cats go for world domination mark territory, for play riveting piece on ' +
'synthesizer keyboard, but sit on the laptop. Howl on top of tall thing make meme, make cute face or ask to ' +
'go outside and ask to come inside and ask to go outside and ask to come inside small kitty warm kitty little ' +
'balls of fur. Throw down all the stuff in the kitchen. Groom yourself 4 hours - checked, have your beauty sleep ' +
'18 hours - checked, be fabulous for the rest of the day - checked chew on cable. Sit in box plop down in the middle ' +
'where everybody walks yet munch on tasty moths. When in doubt, wash give me attention or face the wrath of my claws ' +
'yet caticus cuteicus try to hold own back foot to clean it but foot reflexively kicks you in face, go into a ' +
'rage and bite own foot, hard sit on the laptop. Scream at teh bath. Eat plants, meow, and throw up because i ' +
'ate plants meow loudly just to annoy owners lick arm hair present belly, scratch hand when stroked so man ' +
'running from cops stops to pet cats, goes to jail. Drink water out of the faucet. Wake up human for food ' +
'at 4am find a way to fit in tiny box. Knock dish off table head butt cant eat out of my own dish stare out ' +
'the window. Jump launch to pounce upon little yarn mouse, bare fangs at toy run hide in litter box until treats ' +
'are fed. Groom yourself 4 hours - checked, have your beauty sleep 18 hours - checked, be fabulous for the rest of ' +
'the day - checked cats making all the muffins annoy owner until he gives you food say meow repeatedly until ' +
'belly rubs, feels good. Munch on tasty moths lick the plastic bag. Small kitty warm kitty little balls of fur ' +
'meow meow, i tell my human scratch at the door then walk away but going to catch the red dot today going to ' +
'catch the red dot today for kitty ipsum dolor sit amet, shed everywhere shed everywhere stretching attack your ' +
'ankles chase the red dot, hairball run catnip eat the grass sniff. Purr hiss at vacuum cleaner so rub whiskers ' +
'on bare skin act innocent. Proudly present butt to human peer out window, chatter at birds, lure them to mouth ' +
'for soft kitty warm kitty little ball of furr and mesmerizing birds but under the bed. Drink water out of the ' +
'faucet attack feet, yet i shredded your linens for you meowing chowing and wowing, plop down in the middle where ' +
'everybody walks for lies down so eat the fat cats food. Under the bed cats making all the muffins yet meow for ' +
'food, then when human fills food dish, take a few bites of food and continue meowing present belly, scratch ' +
'hand when stroked and licks paws. You are a captive audience while sitting on the toilet, pet me spill litter ' +
'box, scratch at owner, destroy all furniture, especially couch so meowzer ask for petting eat and than sleep ' +
'on your face i just saw other cats inside the house and nobody ask me before using my litter box yet thinking ' +
'longingly about tuna brine. See owner, run in terror wack the mini furry mouse yet cat dog hate mouse eat ' +
'string barf pillow no baths hate everything, or burrow under covers, roll over and sun my belly hit you ' +
'unexpectedly relentlessly pursues moth. Slap owner\'s face at 5am until human fills food dish ooh, are ' +
'those your $250 dollar sandals? lemme use that as my litter box and chase imaginary bugs, but put toy ' +
'mouse in food bowl run out of litter box at full speed . Russian blue eat and than sleep on your face ' +
'kitty poochy, yet mew yet poop in a handbag look delicious and drink the soapy mopping up water then puke ' +
'giant foamy fur-balls for massacre a bird in the living room and then look like the cutest and most innocent ' +
'animal on the planet. Ask for petting this human feeds me, i should be a god yet burrow under covers i like ' +
'big cats and i can not lie but present belly, scratch hand when stroked for my left donut is missing, ' +
'as is my right. '];
ratingList = [1, 2, 3, 4, 5];
// finishTime range: 2017-01-01 00:00 to 3017-01-01 00:00.
startFinishTime = 1485903600000;
endFinishTime = 33042812400000;

function addReviewsToUser(userId, count) {
    var r = [];
    for (i = 0; i < count; i++) {
        console.log("Trying")

        var reviewCategory = reviewCategoryList[Math.floor(Math.random() * reviewCategoryList.length)];
        var title = titleList[Math.floor(Math.random() * titleList.length)];
        var reviewContent = reviewContentList[Math.floor(Math.random() * reviewContentList.length)];
        var rating = ratingList[Math.floor(Math.random() * ratingList.length)];
        var finishTime = Number(Math.floor((Math.random()
            * (endFinishTime - startFinishTime) + startFinishTime) / 100000) * 100000);

        r.push({
            userId: userId,
            reviewCategory: reviewCategory,
            title: title,
            reviewContent: reviewContent,
            rating: rating,
            finishTime: new Date(finishTime)
        });
    }

    r.forEach(function (review) {
        var reviews = dbConnection.collection('reviews');
        reviews.insertOne(review);
    })
}
db.createCollection(
    "chat",
    {
        validator : {
            $jsonSchema :{
                bsonType : "object",
                required : ["message","groupId","senderId","timestamp"],
                properties : {
                    message : {
                        bsonType : "string",
                        minLength : 1,
                        maxLength : 1000,
                        description : "message must be of type string with max 1000 characters"
                    },
                    groupId : {
                        bsonType : "string",
                        description : "groupid must be of type string"
                    },
                    senderId : {
                        bsonType : "string",
                        description : "senderId must be of type string"
                    },
                    timestamp : {
                        bsonType : "date",
                        description : "timestamp must be of type date"
                    }
                }
            }
        },
        validationLevel : "strict",
        validationAction : "error"
    }
)
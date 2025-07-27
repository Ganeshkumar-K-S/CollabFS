db.createCollection(
    "chat",
    {
        validator : {
            $jsonSchema :{
                bsonType : "object",
                required : ["message","group_id","sender_id","timestamp"],
                properties : {
                    message : {
                        bsonType : "string",
                        minLength : 1,
                        maxLength : 1000,
                        description : "message must be of type string with max 1000 characters"
                    },
                    group_id : {
                        bsonType : "objectId",
                        description : "groupid must be of type objectId"
                    },
                    sender_id : {
                        bsonType : "objectId",
                        description : "sender_id must be of type objectId"
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
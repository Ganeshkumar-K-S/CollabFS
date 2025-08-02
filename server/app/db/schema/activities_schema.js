db.createCollection(
    "activities",
    {
        validator : {
            $jsonSchema : {
                bsonType : "object",
                required : ["userId","groupId","activityType","fileId","timestamp"],
                properties : {
                    userId : {
                        bsonType : "string",
                        description : "userId must be of type string"
                    },
                    groupId : {
                        bsonType : "string",
                        description : "groupId must be of type string"
                    },
                    activityType : {
                        bsonType : "string",
                        description : "activity must be of type string"
                    },
                    fileId : {
                        bsonType : ["objectId","null"],
                        description : "fileId must be of type objectid"
                    },
                    timestamp : {
                        bsonType : "date",
                        description : "description must be of type date"
                    }
                }
            }
        },
        validationLevel : "strict",
        validationAction : "error"
    }
);